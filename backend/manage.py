from app import create_app, db

app = create_app()

if __name__ == '__main__':
    # Run directly when this file is executed as a script
    app.run(host='0.0.0.0', port=5005, debug=True)
