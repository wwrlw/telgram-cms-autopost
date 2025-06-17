import AuthPlugin from './src/infrastructure/plugins/auth.plugin'
import App from './src/infrastructure/webserver/server'
import AuthRoute from './src/interface/routes/auth.route'

export const app = new App({
  plugins: [AuthPlugin],
  routes: [AuthRoute],
})

app.listen()