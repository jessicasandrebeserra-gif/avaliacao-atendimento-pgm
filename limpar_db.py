import sqlite3
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, 'avaliacao.db')

try:
    if os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM avaliacoes')
        conn.commit()
        conn.close()
        print(f"✓ Banco de dados limpo com sucesso!")
        print(f"Arquivo: {DB_PATH}")
    else:
        print(f"✗ Arquivo não encontrado: {DB_PATH}")
except Exception as e:
    print(f"✗ Erro ao limpar banco: {e}")
