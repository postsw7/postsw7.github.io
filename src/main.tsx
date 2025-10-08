import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './ui/App'
import { ThemeProvider } from './ui/theme/ThemeProvider'
import './styles.css'
import './styles/theme.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<ThemeProvider>
		<App />
	</ThemeProvider>
)
