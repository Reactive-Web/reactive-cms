Reactive CMS using VENoM
-
- VueJS
- ExpressJS
- NodeJS
- MongoDB

Requeriments
-
- NodeJS
- MongoDB

Installation
-
```bash
git clone https://gitlab.com/eduardobc88/VENoM.git
cd VENoM
npm install
```

Initial Configuration
-
- Edit config/config.js file with your preferences
```javascript
const APP_CONFIG = {
    port: 3000,
    mongoDBURI: 'mongodb://172.17.0.2:27017/venom',
    bcryptSaltRounds: 12,
    appSecret: 'E5OReactiveWeb2018',
}
```

Running App
-
```bash
npm run pm2:start-watch # 'development mode for compile NodeJS app'
npm run webpack:website-watch # 'development mode for compile Vue app'
npm run pm2:global-logs # 'development mode check NodeJS app logs'
```

Test
-
If you don't edit nothing about default ports from config.js

Now enter to: localhost:3000/setup


For more check package.json file
-


## Development by:
[ReactiveWeb](https:www.reactive-web.com)

## Email:
eduardobc.88@gmail.com
