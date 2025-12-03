ML Chatbot – Semantic Intent + Context Memory

A lightweight AI-assisted career guidance chatbot using SpaCy word embeddings, Flask backend, and a modern chat UI.
Supports semantic intent detection, conversation memory, and context-aware replies.

🚀 Overview

This chatbot understands user queries by comparing messages with pre-computed vector embeddings of training patterns.
A short-term conversation memory helps maintain topic continuity, producing more natural multi-turn conversations.

🧠 Core Features

Semantic intent recognition (SpaCy en_core_web_md vectors)

Cosine similarity + embeddings for robust matching

Conversation memory (context-carryover for follow-up questions)

Modern UI with avatar, animations, timestamps

Fully local — no external API costs

Easy to train using a single intents.json file

Project Architecture

ml_chatbot/
│
├── app.py                      # Flask backend (prediction + memory)
├── train_embeddings.py         # Generates embedding vectors
├── intents.json                # Training dataset (intents + patterns)
│
├── embeddings_model/           # Auto-generated model data
│     ├── pattern_vectors.pkl
│     ├── labels.pkl
│     ├── vocab.pkl
│     └── pattern_tags.pkl
│
├── templates/
│     └── index.html            # Chat UI layout
│
├── static/
│     ├── style.css             # Frontend styling
│     ├── script.js             # Chat logic + animations
│     └── avatar.png            # Bot avatar
│
├── requirements.txt
└── README.md
User Message 
   ↓
spaCy Embedding (vector)
   ↓
Cosine Similarity with pattern_vectors.pkl
   ↓
Best Match → Intent Tag
   ↓
Select Response from intents.json
   ↓
Conversation Memory Updated
   ↓
Frontend UI (animated response)

pip install -r requirements.txt
python -m spacy download en_core_web_md
python train_embeddings.py
python app.py

📌 Tech Stack

Python, Flask

SpaCy embeddings (en_core_web_md)

NumPy

HTML + CSS + Vanilla JS

🎯 Ideal For

✔ College AI/ML projects
✔ Career-guidance chatbots
✔ Local ML chatbot demos
✔ Understanding intent-based NLP