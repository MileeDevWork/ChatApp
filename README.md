#### First Method
```shell
git clone https://github.com/koolkishan/chat-app-react-nodejs
cd chat-app-react-nodejs
```
Now rename env files from .env.example to .env
```shell
cd public
mv .env.example .env
cd ..
cd server
mv .env.example .env
cd ..
```

Now install the dependencies
```shell
cd server
yarn
cd ..
cd public
yarn
```
We are almost done, Now just start the development server.

For Frontend.
```shell
cd public
yarn start
```
For Backend.

Open another terminal in folder, Also make sure mongodb is running in background.
```shell
cd server
yarn start
```
Done! Now open localhost:3000 in your browser.

## Running the Application

1. Find your IP address:
```shell
# Open Command Prompt and run
ipconfig
# Look for IPv4 Address under your network adapter
```

2. Update the IP in `/public/.env`:
```env
REACT_APP_SERVER_URL="http://YOUR_IP:5001"
```

3. Start the backend server:
```shell
cd server
npm start
```

4. In a new terminal, start the frontend:
```shell
cd public
npm start
```

5. Access the application:
- On your machine: http://localhost:3000
- From other devices on the same network: http://YOUR_IP:3000

## Troubleshooting

1. If other devices can't connect:
- Check firewall settings
- Ensure all devices are on the same network
- Verify correct IP address in .env file