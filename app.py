from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///expenses.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SESSION_SECRET', 'dev-secret-key')

db = SQLAlchemy(app)

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200))
    date = db.Column(db.Date, nullable=False, default=lambda: datetime.now(timezone.utc).date())
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'amount': self.amount,
            'category': self.category,
            'description': self.description,
            'date': self.date.strftime('%Y-%m-%d'),
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

with app.app_context():
    db.create_all()

# ── Page Routes ──────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html', active='home')

@app.route('/dashboard')
def dashboard_page():
    return render_template('dashboard.html', active='dashboard')

@app.route('/summary')
def summary_page():
    return render_template('summary.html', active='summary')

@app.route('/about')
def about_page():
    return render_template('about.html', active='about')

# ── API Routes ───────────────────────────────────────────────
@app.route('/expenses')
def get_expenses():
    category = request.args.get('category')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = Expense.query

    if category and category != 'all':
        query = query.filter_by(category=category)
    if start_date:
        query = query.filter(Expense.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(Expense.date <= datetime.strptime(end_date, '%Y-%m-%d').date())

    expenses = query.order_by(Expense.date.desc()).all()
    return jsonify([e.to_dict() for e in expenses])

@app.route('/expenses/add', methods=['POST'])
def add_expense():
    data = request.json
    expense = Expense(
        amount=float(data['amount']),
        category=data['category'],
        description=data.get('description', ''),
        date=datetime.strptime(data['date'], '%Y-%m-%d').date()
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify(expense.to_dict()), 201

@app.route('/expenses/<int:id>', methods=['GET'])
def get_expense(id):
    expense = db.get_or_404(Expense, id)
    return jsonify(expense.to_dict())

@app.route('/expenses/<int:id>', methods=['PUT'])
def update_expense(id):
    expense = db.get_or_404(Expense, id)
    data = request.json
    expense.amount = float(data['amount'])
    expense.category = data['category']
    expense.description = data.get('description', '')
    expense.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    db.session.commit()
    return jsonify(expense.to_dict())

@app.route('/expenses/<int:id>', methods=['DELETE'])
def delete_expense(id):
    expense = db.get_or_404(Expense, id)
    db.session.delete(expense)
    db.session.commit()
    return '', 204

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
