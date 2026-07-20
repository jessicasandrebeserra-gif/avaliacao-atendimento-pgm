from flask import Flask, request, jsonify
import sqlite3
import json
import os
import hashlib

app = Flask(__name__, static_url_path='', static_folder='.')
app.config['JSON_AS_ASCII'] = False

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, 'avaliacao.db')

# Hash SHA-256 da senha atual do programador.
# A senha não fica exposta no JavaScript nem é enviada de volta ao navegador.
HASH_SENHA_PROGRAMADOR = (
    '083e9e06537510eba266871443c9448e480edf649aaf265efc02eef63f1df216'
)


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def criar_banco():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS avaliacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                avaliador TEXT,
                atendente TEXT,
                avaliacao TEXT,
                peso INTEGER,
                subgrupos TEXT,
                subgrupo TEXT,
                data TEXT,
                hora TEXT,
                timestamp TEXT
            )
        ''')
        conn.commit()


criar_banco()


@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


@app.route('/')
def home():
    return app.send_static_file('index.html')


@app.route('/login-programador', methods=['POST', 'OPTIONS'])
def login_programador():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    dados = request.get_json(silent=True) or {}
    senha = str(dados.get('senha', ''))

    hash_digitado = hashlib.sha256(
        senha.encode('utf-8')
    ).hexdigest()

    if hash_digitado == HASH_SENHA_PROGRAMADOR:
        return jsonify({
            'autorizado': True,
            'mensagem': 'Acesso autorizado'
        }), 200

    return jsonify({
        'autorizado': False,
        'mensagem': 'Senha incorreta. Tente novamente.'
    }), 401


@app.route('/avaliacoes', methods=['GET'])
def listar_avaliacoes():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM avaliacoes ORDER BY id ASC')
        rows = cursor.fetchall()

    avaliacoes = []

    for row in rows:
        try:
            subgrupos = json.loads(row['subgrupos']) if row['subgrupos'] else []
        except Exception:
            subgrupos = []

        avaliacoes.append({
            'id': row['id'],
            'avaliador': row['avaliador'],
            'atendente': row['atendente'],
            'avaliacao': row['avaliacao'],
            'peso': row['peso'],
            'subgrupos': subgrupos,
            'subgrupo': row['subgrupo'],
            'data': row['data'],
            'hora': row['hora'],
            'timestamp': row['timestamp']
        })

    return jsonify(avaliacoes)


@app.route('/salvar', methods=['POST', 'OPTIONS'])
def salvar():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    dados = request.get_json(force=True)

    subgrupos = dados.get('subgrupos') or []

    if not isinstance(subgrupos, list):
        subgrupos = [str(subgrupos)]

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO avaliacoes
            (
                avaliador,
                atendente,
                avaliacao,
                peso,
                subgrupos,
                subgrupo,
                data,
                hora,
                timestamp
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            dados.get('avaliador'),
            dados.get('atendente'),
            dados.get('avaliacao'),
            int(dados.get('peso', 0)) if dados.get('peso') is not None else None,
            json.dumps(subgrupos, ensure_ascii=False),
            dados.get('subgrupo'),
            dados.get('data'),
            dados.get('hora'),
            dados.get('timestamp')
        ))

        novo_id = cursor.lastrowid
        conn.commit()

    return jsonify({
        'mensagem': 'Salvo com sucesso',
        'id': novo_id
    }), 201


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)