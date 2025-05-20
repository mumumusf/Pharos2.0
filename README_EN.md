# Pharos Automation Script Tutorial

English | [中文](README.md)

### 1. Registration and Test Token Claim

1. Register on [Pharos Testnet](https://testnet.pharosnetwork.xyz/experience?inviteCode=esQH22vAFdYm5ZKj)
2. Claim test tokens on [Pharos Testnet](https://testnet.pharosnetwork.xyz/)
3. Bind Twitter/Discord in your profile
4. Swap PHRS for wPHRS to use the script

### 2. Download and Install nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc   # if using bash
source ~/.zshrc    # if using zsh
```

### 3. Install Node.js 22

```bash
nvm install 22
nvm list
nvm use 22
nvm alias default 22
```

### 4. Verify Installation

```bash
node -v   # Expected output: v22.13.1
nvm current # Expected output: v22.13.1
npm -v    # Expected output: 10.9.2
```

### 5. Deploy Script

1. Clone repository:
   ```bash
   git clone https://github.com/mumumusf/Pharos2.0.git
   cd Pharos2.0
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run script with screen session (Recommended):
   ```bash
   screen -S pharos
   node Pharos.js
   ```
   - Press `Ctrl + A` then `D` to detach session, script will continue running
   - Reattach session: `screen -r pharos`

4. Run script directly (Not recommended, will stop when terminal closes):
   ```bash
   node Pharos.js
   ```

### 6. Contact

For any questions or suggestions, please contact the author:

- Twitter: [@YOYOMYOYOA](https://x.com/YOYOMYOYOA)
- Telegram: [@YOYOZKS](https://t.me/YOYOZKS)

### 7. Disclaimer

1. This program is for learning and communication purposes only
2. Commercial use is prohibited
3. Users are responsible for any consequences of using this program

### 8. Security Tips

- This tool does not leak private keys, but please use a new wallet
- Ensure sufficient balance in your wallet
- Check exchange rates and fees before trading

Made with ❤️ by @YOYOMYOYOA 