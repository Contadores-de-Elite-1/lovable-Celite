#!/usr/bin/env python3

import anthropic
import os

# Você precisa configurar sua API key
# export ANTHROPIC_API_KEY="sua-chave-aqui"

client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")
)

message = client.messages.create(
    model="claude-3-5-haiku-latest",
    max_tokens=200,
    messages=[
        {"role": "user", "content": "Teste: Você está rodando o modelo Haiku?"}
    ]
)

print(f"Modelo: {message.model}")
print(f"Resposta: {message.content[0].text}")
