to start backend
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start backend (fast mode for testing)
python startup.py --fast-mode 200 --skip-llm

# 3. In another terminal, start frontend
npm install && npm run dev

# 4. Visit http://localhost:5173 and test the chatbot!