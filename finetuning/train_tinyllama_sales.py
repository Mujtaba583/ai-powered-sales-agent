"""
Indus University Karachi - Faculty of Engineering Science and Technology (FEST)
Final Year Project: An AI-Powered Intelligent Sales Agent using Voice Interaction and Large Language Models
Students: Mujtaba Khan, Israr Khan, Arham ul haq, Aaniq joseph
Supervisor: Sir Dayanand | Co-Supervisor: Engr. Emaan

Script: Fine-Tuning TinyLlama 1.1B Chat on Solar Sales Dataset using QLoRA / PEFT
Target GPU: Free Google Colab T4 (15GB VRAM) or Kaggle P100/T4
"""

import os
import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer

# 1. Configuration
MODEL_ID = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
DATASET_FILE = "solar_sales_tinyllama_dataset.json"
OUTPUT_DIR = "./tinyllama-solar-sales-agent"

# 2. Format prompt into TinyLlama Chat template
# TinyLlama chat format:
# <|system|>
# {system_message}</s>
# <|user|>
# {user_message}</s>
# <|assistant|>
# {assistant_message}</s>
def format_prompts(example):
    system_msg = example.get("instruction", "You are an intelligent AI Sales Agent for a solar panel company.")
    user_msg = example.get("input", "")
    assistant_msg = example.get("output", "")
    
    text = f"<|system|>\n{system_msg}</s>\n<|user|>\n{user_msg}</s>\n<|assistant|>\n{assistant_msg}</s>"
    return {"text": text}

def main():
    print("=" * 60)
    print("Starting TinyLlama 1.1B Sales Agent Fine-Tuning Pipeline...")
    print("=" * 60)

    # 3. 4-bit Quantization Config (QLoRA)
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    # 4. Load Base Model and Tokenizer
    print(f"Loading base model: {MODEL_ID}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )

    model = prepare_model_for_kbit_training(model)

    # 5. LoRA Parameter Config
    peft_config = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    )

    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    # 6. Load & preprocess dataset
    print(f"Loading sales dataset from {DATASET_FILE}...")
    dataset = load_dataset("json", data_files=DATASET_FILE)
    formatted_dataset = dataset["train"].map(format_prompts)

    # 7. Training Arguments
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=5,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        lr_scheduler_type="cosine",
        warmup_ratio=0.05,
        logging_steps=10,
        save_strategy="epoch",
        optim="paged_adamw_8bit",
        fp16=True,
        report_to="none",
    )

    # 8. SFT Trainer
    trainer = SFTTrainer(
        model=model,
        train_dataset=formatted_dataset,
        peft_config=peft_config,
        dataset_text_field="text",
        max_seq_length=512,
        tokenizer=tokenizer,
        args=training_args,
    )

    print("Beginning Training...")
    trainer.train()

    # 9. Save LoRA Adapters
    print(f"Saving fine-tuned adapter to {OUTPUT_DIR}...")
    trainer.model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print("Fine-tuning completed successfully!")

if __name__ == "__main__":
    main()
