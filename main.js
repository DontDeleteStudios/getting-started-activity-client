import { DiscordSDK } from "@discord/embedded-app-sdk";

import rocketLogo from '/rocket.png';
import "./style.css";

// Will eventually store the authenticated user's access_token
let auth;

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

setupDiscordSdk().then(() => {
	console.info("LogDelete: Discord SDK is authenticated");

	// We can now make API calls within the scopes we requested in setupDiscordSDK()
	// Note: the access_token returned is a sensitive secret and should be treated as such
	appendVoiceChannelName();
	appendGuildAvatar();
});

async function checkHealth() {
	try {
	  const health_res = await fetch('/health', { method: 'GET' });
  
	  if (!health_res.ok) {
		throw new Error(`Health check failed: ${health_res.status} ${health_res.statusText}`);
	  }
  
	  const { health } = await health_res.json();
	  console.info('Health Results: ', health);
	} catch (error) {
	  console.error('Error in health check:', error);
	  // Handle the error here, e.g., display an error message to the user
	}
}

async function getAccessToken(code) {
	try {
	  const response = await fetch("/api/token", {
		method: "POST",
		headers: {
		  "Content-Type": "application/json",
		},
		body: JSON.stringify({ code }),
	  });
  
	  if (!response.ok) {
		throw new Error(`Failed to retrieve access token: ${response.status} ${response.statusText}`);
	  }
  
	  const { access_token } = await response.json();
	  return access_token;
	} catch (error) {
	  console.error("Error retrieving access token:", error);
	  // Handle the error here, e.g., display an error message to the user
	  throw error; // Optional: Rethrow the error for further handling
	}
}

async function setupDiscordSdk() {
	await discordSdk.ready();

	console.info("LogDelete: Discord SDK is ready");

	// Authorize with Discord Client
	const { code } = await discordSdk.commands.authorize({
		client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
		response_type: "code",
		state: "",
		prompt: "none",
		scope: [
			"identify",
			"guilds",
		],
	});

	console.info("LogDelete: Authorized Discord client")

	console.info("LogDelete: Performing health check on server")

	checkHealth();

	console.info("LogDelete: Retrieve access token")
	// Retrieve an access_token from your activity's server
	getAccessToken(code)
		.then((accessToken) => {
			console.log("Access token:", accessToken);
			// Use the access token for further operations
		})
		.catch((error) => {
			console.error("Error occurred:", error);
			// Handle the error here, e.g., display an error message to the user
		});

	console.info("LogDelete: Access token retrieved")

	console.info("LogDelete: Authenticating Discord client w/ access token")

	// Authenticate with Discord client (using the access_token)
	auth = await discordSdk.commands.authenticate({
		access_token,
	});

	if (auth == null) {
		console.info("LogDelete: Authentication with Discord client failed")
		throw new Error("Authenticate command failed");
	}

	console.info("LogDelete: Discord SDK setup complete")
}

// Append voice channel name
async function appendVoiceChannelName() {
	const app = document.querySelector('#app');
  
	let activityChannelName = 'Unknown';
  
	// Requesting the channel in GDMs (when the guild ID is null) requires
	// the dm_channels.read scope which requires Discord approval.
	if (discordSdk.channelId != null && discordSdk.guildId != null) {
		// Over RPC collect info about the channel
		const channel = await discordSdk.commands.getChannel({channel_id: discordSdk.channelId});
		if (channel.name != null) {
			activityChannelName = channel.name;
		}
	}
  
	// Update the UI with the name of the current voice channel
	const textTagString = `Activity Channel: "${activityChannelName}"`;
	const textTag = document.createElement('p');
	textTag.textContent = textTagString;
	app.appendChild(textTag);
}

async function appendGuildAvatar() {
	const app = document.querySelector('#app');
  
	// 1. From the HTTP API fetch a list of all of the user's guilds
	const guilds = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
		headers: {
			// NOTE: we're using the access_token provided by the "authenticate" command
			Authorization: `Bearer ${auth.access_token}`,
			'Content-Type': 'application/json',
		},
	}).then((response) => response.json());
  
	// 2. Find the current guild's info, including it's "icon"
	const currentGuild = guilds.find((g) => g.id === discordSdk.guildId);
  
	// 3. Append to the UI an img tag with the related information
	if (currentGuild != null) {
		const guildImg = document.createElement('img');
		guildImg.setAttribute(
			'src',
			// More info on image formatting here: https://discord.com/developers/docs/reference#image-formatting
			`https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.webp?size=128`
		);
		guildImg.setAttribute('width', '128px');
		guildImg.setAttribute('height', '128px');
		guildImg.setAttribute('style', 'border-radius: 50%;');
		app.appendChild(guildImg);
	}
}

document.querySelector('#app').innerHTML = `
	<div>
		<img src="${rocketLogo}" class="logo" alt="Discord" />
		<h1>Hello from vercel, ya nerd!</h1>
	</div>
`;
