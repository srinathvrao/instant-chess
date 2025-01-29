import chess
import chess.engine
import json
import os
import random
import boto3

stockfish_path = "/tmp/stockfish"
def get_best_move(fen: str, difficulty):
    s3_bucket = 'chessenginebucket'
    s3_key = 'stockfish'
    s3_client = boto3.client('s3')
    s3_client.download_file(s3_bucket, s3_key, stockfish_path)
    skills = {"1": 15, "2":7, "3": 3}
    os.chmod(stockfish_path, 0o755)
    board = chess.Board(fen)
    with chess.engine.SimpleEngine.popen_uci(stockfish_path) as engine:
        engine.configure({"Skill Level": skills[difficulty]})
        result = engine.play(board, chess.engine.Limit(time=0.5))
        best_move = result.move
        source_square = chess.square_name(best_move.from_square)
        target_square = chess.square_name(best_move.to_square)
        return source_square, target_square

def getTrashtalk(piece):
    if random.uniform(0,1)<=0.3:
        tset = set()
        tfile = open(piece+".txt", "r", encoding="utf-8")
        for line in tfile:
            line = line.strip()
            tset.add(line)
        return random.choice(list(tset))
    trashtalkfile = "trashtalks.txt"
    tset = set()
    with open(trashtalkfile, "r", encoding="utf-8") as tfile:
        for line in tfile:
            line = line.strip()
            tset.add(line)
    return random.choice(list(tset))

def lambda_handler(data, context):
    fen_string = data["fen"]
    diff = data["diff"]
    talk = "nothing"
    if random.uniform(0,1) <= 0.4: 
        talk = getTrashtalk(data["piece"])
    try:
        source, target = get_best_move(fen_string, diff)
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': 'https:',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "source": source, 
                "target": target,
                "talk": talk,
            })
        }
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': 'https://instantgames.org',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "source": "", 
                "target": "",
                "talk": "",
            })
        }