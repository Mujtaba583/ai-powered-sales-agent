"""
Inference test script for Fine-Tuned TinyLlama 1.1B Sales Agent
"""

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

BASE_MODEL = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
ADAPTER_PATH = "./tinyllama-solar-sales-agent"

print("Loading tokenizer and model...")
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    torch_dtype=torch.float16,
    device_map="auto"
)

# Load fine-tuned LoRA weights
model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
model.eval()

def ask_sales_agent(user_query: str) -> str:
    prompt = f"<|system|>\nYou are an intelligent AI Sales Agent for a solar energy company. Answer clearly, recommend the optimal capacity, and ask for customer contact details to arrange a survey.</s>\n<|user|>\n{user_query}</s>\n<|assistant|>\n"
    inputs = tokenizer(prompt, return_tensors="pt").to("cuda" if torch.cuda.is_available() else "cpu")
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=256,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
            do_sample=True,
            eos_token_id=tokenizer.eos_token_id
        )
    
    response = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
    return response.strip()

if __name__ == "__main__":
    test_queries = [
        "Tell me about a 5kW solar system for my home.",
        "My monthly electricity bill is 50,000 PKR. What system do you recommend?",
        "Do you offer battery backup for load shedding?"
    ]
    for q in test_queries:
        print(f"\nUser: {q}")
        print(f"TinyLlama Sales Agent: {ask_sales_agent(q)}")
