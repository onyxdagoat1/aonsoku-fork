
### Installation

1. Clone the repo

2. Install NPM packages
```sh
npm install
```

### Running

* Web App
```sh
npm run dev
```

* Desktop App
```sh
npm run electron:dev
```

* Docker
```yml
version: '3.8'

services:
  aonsoku:
    container_name: aonsoku
    image: ghcr.io/victoralvesf/aonsoku:latest
    restart: unless-stopped
    ports:
      - 8080:8080
```

* Podman Quadlet
```ini
[Unit]
Description=Aonsoku Container

[Container]
ContainerName=aonsoku
Image=ghcr.io/victoralvesf/aonsoku:latest
PublishPort=8080:8080
AutoUpdate=registry

[Service]
Restart=always

[Install]
WantedBy=multi-user.target default.target
```

<details>
  <summary>Environment Variables</summary>
  </br>

Below is a table describing the environment variables that can be used in this project. Adjust them as necessary in your `.env` file.

| Variable              | Default    | Description                                                                                                       | Required for Automatic Login |
|-----------------------|------------|-------------------------------------------------------------------------------------------------------------------|------------------------------|
| `PORT`                | `8080`     | The port the application runs on.                                                                                 |                              |
| `SERVER_URL`          |            | If you want the app to access a predefined Subsonic server. </br> **Format:** `http://your-subsonic-server:port`. | ✅                           |
| `HIDE_SERVER`         | `false`    | Set to `true` to hide the server URL field on login and only show username and password.                          | ✅                           |
| `APP_USER`            |            | The username for automatic login.                                                                                 | ✅                           |
| `APP_PASSWORD`        |            | The password for automatic login.                                                                                 | ✅                           |
| `APP_AUTH_TYPE`       | `token`    | Specifies the authentication method. </br> **Options:** `token` or `password`.                                    |                              |
| `SERVER_TYPE`         | `subsonic` | Specifies the server name (important for some fixes). </br> **Options:** `subsonic`, `navidrome` or `lms`         |                              |
| `HIDE_RADIOS_SECTION` | `false`    | Set to `true` to hide the radios page from the sidebar menu.                                                      |                              |

**Notes:**
- **Automatic Login:** To enable automatic login across devices. This should only be used in secure local environments to avoid password compromise.
- **Legacy Authentication:** Use `APP_AUTH_TYPE=password` only if your server does not support token-based authentication.

</details>


### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Biome.js](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<div id="apple-users"></div>

## macOS Users: "App cannot be opened" or Crash on Launch

Since this application is not signed and notarized by Apple, macOS Gatekeeper may block it from running to protect your system. You might encounter:
1. A message saying the app **"is damaged and can't be opened."**
2. An immediate crash or error window upon launching.

To fix this, please follow these steps:

1. Move **Aonsoku** to your `/Applications` folder.
2. Open your **Terminal**.
3. Run the following commands to repair the permission and signature (you may need to enter your system password):

```bash
# 1. Remove the quarantine attribute (Fixes "App is damaged")
sudo xattr -cr /Applications/Aonsoku.app

# 2. Re-sign the application locally (Fixes immediate crashes/library errors)
sudo codesign --force --deep --sign - /Applications/Aonsoku.app
```

4. You can now open Aonsoku normally.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



