# Pharos 自动化脚本使用教学

[English](README_EN.md) | 中文

## 1. 注册与领取测试币

1. 注册 [Pharos Testnet](https://testnet.pharosnetwork.xyz/experience?inviteCode=esQH22vAFdYm5ZKj)
2. 领取测试币 [Pharos Testnet](https://testnet.pharosnetwork.xyz/)
3. 在个人资料上绑定 Twitter/Discord
4. 使用 PHRS 换取 wPHRS，以便使用脚本

## 2. 下载并安装 nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc   # 如果使用 bash
source ~/.zshrc    # 如果使用 zsh
```

## 3. 安装 Node.js 22

```bash
nvm install 22
nvm list
nvm use 22
nvm alias default 22
```

## 4. 验证安装

```bash
node -v   # 预期输出: v22.13.1
nvm current # 预期输出: v22.13.1
npm -v    # 预期输出: 10.9.2
```

## 5. 部署脚本

1. 克隆仓库：
   ```bash
   git clone https://github.com/mumumusf/Pharos2.0.git
   cd Pharos2.0
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 使用 screen 会话后台运行脚本（推荐）：
   ```bash
   screen -S pharos
   node Pharos.js
   ```
   - 按下 `Ctrl + A` 然后按 `D` 可分离会话，脚本会在后台继续运行
   - 重新连接会话：`screen -r pharos`

4. 直接运行脚本（不推荐，关闭终端会中断）：
   ```bash
   node Pharos.js
   ```

## 6. 联系方式

如有任何问题或建议，欢迎通过以下方式联系作者:

- Twitter：[@YOYOMYOYOA](https://x.com/YOYOMYOYOA)
- Telegram：[@YOYOZKS](https://t.me/YOYOZKS)

## 7. 免责声明

1. 本程序仅供学习交流使用
2. 禁止用于商业用途
3. 使用本程序产生的任何后果由用户自行承担

## 8. 安全提示

- 本工具不会泄露私钥，但请使用新钱包进行操作
- 请确保钱包中有足够的余额
- 交易前请仔细核对汇率和手续费

Made with ❤️ by @YOYOMYOYOA 