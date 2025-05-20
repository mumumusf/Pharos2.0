/**
 * Pharos 测试网自动化脚本
 * 作者：小林
 * 功能：自动领取水龙头、签到、转账和交换代币
 */

require('dotenv').config();
const { ethers } = require('ethers');
const { HttpsProxyAgent } = require('https-proxy-agent');
const randomUseragent = require('random-useragent');
const axios = require('axios');
const readline = require('readline');
const banner = require('./banner');

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 将readline的question方法转换为Promise
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// ===== 网络和代币配置 =====
const network = {
  name: 'Pharos Testnet',
  chainId: 688688,
  rpcUrl: 'https://testnet.dplabs-internal.com',
  nativeCurrency: 'PHRS',
};

// 代币合约地址和精度配置
const tokens = {
  USDC: { address: '0xad902cf99c2de2f1ba5ec4d642fd7e49cae9ee37', decimals: 6 },
  WPHRS: { address: '0x76aaada469d23216be5f7c596fa25f282ff9b364', decimals: 18 },
};

// 合约地址和ABI配置
const contractAddress = '0x1a4de519154ae51200b0ad7c90f7fac75547888a';
const multicallABI = ['function multicall(uint256 collectionAndSelfcalls, bytes[] data) public'];
const erc20ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) public returns (bool)',
];

// ===== 日志输出配置 =====
const colors = {
  reset: '\x1b[0m', cyan: '\x1b[36m', green: '\x1b[32m',
  yellow: '\x1b[33m', red: '\x1b[31m', white: '\x1b[37m', bold: '\x1b[1m',
};

// 日志输出工具
const logger = {
  info: (msg) => console.log(`${colors.green}[✓] ${msg}${colors.reset}`),
  wallet: (msg) => console.log(`${colors.yellow}[➤] ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}[!] ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}[✗] ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}[+] ${msg}${colors.reset}`),
  loading: (msg) => console.log(`${colors.cyan}[⟳] ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.white}[➤] ${msg}${colors.reset}`),
};

// 打印程序banner
const printBanner = () => {
  console.log(banner);
};

// ===== 工具函数 =====
// 延时函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 重试机制
const retry = async (fn, maxAttempts = 3, delayMs = 2000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      logger.warn(`尝试 ${attempt} 失败，${delayMs}ms后重试...`);
      await delay(delayMs);
    }
  }
};

// 领取水龙头函数
const claimFaucet = async (wallet, proxy = null) => {
  try {
    logger.step(`开始领取水龙头 - ${wallet.address}`);
    const message = "pharos";
    const signature = await wallet.signMessage(message);

    const loginUrl = `https://api.pharosnetwork.xyz/user/login?address=${wallet.address}&signature=${signature}&invite_code=S6NGMzXSCDBxhnwo`;
    const headers = {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.8",
      "sec-ch-ua": '"Chromium";v="136", "Brave";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "sec-gpc": "1",
      Referer: "https://testnet.pharosnetwork.xyz/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "User-Agent": randomUseragent.getRandom(),
    };

    // 登录获取JWT
    const loginResponse = await retry(async () => {
      const res = await axios.post(loginUrl, {}, {
        headers,
        httpsAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
      });
      if (res.status === 403) throw new Error('403 Forbidden: 检查API访问权限或代理');
      return res;
    });

    const jwt = loginResponse.data?.data?.jwt;
    if (!jwt) {
      logger.warn('水龙头登录失败');
      return;
    }

    // 检查水龙头状态
    const statusResponse = await retry(async () => {
      const res = await axios.get(`https://api.pharosnetwork.xyz/faucet/status?address=${wallet.address}`, {
        headers: { ...headers, authorization: `Bearer ${jwt}` },
        httpsAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
      });
      if (res.status === 403) throw new Error('403 Forbidden: 检查JWT或API限制');
      return res;
    });

    const available = statusResponse.data?.data?.is_able_to_faucet;
    if (!available) {
      const nextAvailable = new Date(statusResponse.data?.data?.avaliable_timestamp * 1000).toLocaleString('en-US', { timeZone: 'Asia/Makassar' });
      logger.warn(`今日水龙头已领取，下一可用时间：${nextAvailable}`);
      return;
    }

    // 领取水龙头
    const claimResponse = await retry(async () => {
      const res = await axios.post(`https://api.pharosnetwork.xyz/faucet/daily?address=${wallet.address}`, {}, {
        headers: { ...headers, authorization: `Bearer ${jwt}` },
        httpsAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
      });
      if (res.status === 403) throw new Error('403 Forbidden: 检查API访问权限或速率限制');
      return res;
    });

    if (claimResponse.data?.code === 0) {
      logger.success('水龙头领取成功');
    } else {
      logger.warn(`水龙头领取失败：${claimResponse.data?.msg || '未知错误'}`);
    }
  } catch (e) {
    logger.error(`领取水龙头异常：${e.message}`);
    if (e.response) {
      logger.error(`响应详情：${JSON.stringify(e.response.data, null, 2)}`);
    }
  }
};

// 每日签到函数
const performCheckIn = async (wallet, proxy = null) => {
  try {
    logger.step(`开始每日签到 - ${wallet.address}`);
    const message = "pharos";
    const signature = await wallet.signMessage(message);
    const loginUrl = `https://api.pharosnetwork.xyz/user/login?address=${wallet.address}&signature=${signature}&invite_code=S6NGMzXSCDBxhnwo`;
    const headers = {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.8",
      "sec-ch-ua": '"Chromium";v="136", "Brave";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "sec-gpc": "1",
      Referer: "https://testnet.pharosnetwork.xyz/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "User-Agent": randomUseragent.getRandom(),
    };

    // 登录获取JWT
    const loginRes = await retry(async () => {
      const res = await axios.post(loginUrl, {}, {
        headers,
        httpsAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
      });
      if (res.status === 403) throw new Error('403 Forbidden: 检查API访问权限或代理');
      return res;
    });

    const jwt = loginRes.data?.data?.jwt;
    if (!jwt) {
      logger.warn('签到登录失败');
      return;
    }

    // 执行签到
    const signRes = await retry(async () => {
      const res = await axios.post(`https://api.pharosnetwork.xyz/sign/in?address=${wallet.address}`, {}, {
        headers: { ...headers, authorization: `Bearer ${jwt}` },
        httpsAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
      });
      if (res.status === 403) throw new Error('403 Forbidden: 检查JWT或API限制');
      return res;
    });

    if (signRes.data?.code === 0) {
      logger.success('签到成功');
    } else {
      logger.warn(`签到失败或已签过：${signRes.data?.msg || '未知错误'}`);
    }
  } catch (e) {
    logger.error(`签到异常：${e.message}`);
    if (e.response) {
      logger.error(`响应详情：${JSON.stringify(e.response.data, null, 2)}`);
    }
  }
};

// 转账PHRS函数
const transferPHRS = async (wallet, provider) => {
  try {
    for (let i = 0; i < 10; i++) {
      const amount = 0.000001;
      const to = ethers.Wallet.createRandom().address;
      const balance = await provider.getBalance(wallet.address);
      const required = ethers.parseEther(amount.toString());
      if (balance < required) {
        logger.warn(`PHRS 余额不足，跳过转账 ${i + 1}`);
        return;
      }
      const tx = await wallet.sendTransaction({
        to,
        value: required,
        gasLimit: 21000,
        gasPrice: 0,
      });
      logger.loading(`转账 ${i + 1} 发出，金额：${amount} PHRS，目标地址：${to}，等待确认...`);
      await tx.wait();
      logger.success(`转账 ${i + 1} 成功: ${tx.hash}，金额：${amount} PHRS，目标地址：${to}`);
      await delay(1000 + Math.random() * 2000);
    }
  } catch (e) {
    logger.error(`转账异常：${e.message}`);
    if (e.transaction) {
      logger.error(`交易详情：${JSON.stringify(e.transaction, null, 2)}`);
    }
    if (e.receipt) {
      logger.error(`收据：${JSON.stringify(e.receipt, null, 2)}`);
    }
  }
};

// 代币交换函数
const performSwap = async (wallet, provider) => {
  try {
    const pairs = [
      { from: 'WPHRS', to: 'USDC', amount: 0.001 },
      { from: 'USDC', to: 'WPHRS', amount: 0.1 },
    ];
    const contract = new ethers.Contract(contractAddress, multicallABI, wallet);

    for (let i = 0; i < 10; i++) {
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      const token = tokens[pair.from];
      const decimals = token.decimals;
      const amount = ethers.parseUnits(pair.amount.toString(), decimals);
      const tokenContract = new ethers.Contract(token.address, erc20ABI, wallet);
      const balance = await tokenContract.balanceOf(wallet.address);
      if (balance < amount) {
        logger.warn(`${pair.from} 余额不足，跳过 swap ${i + 1}`);
        return;
      }
      const allowance = await tokenContract.allowance(wallet.address, contractAddress);
      if (allowance < amount) {
        const approveTx = await tokenContract.approve(contractAddress, ethers.MaxUint256);
        await approveTx.wait();
        logger.success('授权成功');
      }
      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'address', 'uint256', 'address', 'uint256', 'uint256', 'uint256'],
        [
          tokens[pair.from].address,
          tokens[pair.to].address,
          500,
          wallet.address,
          pair.from === 'WPHRS' ? '0x0000002386f26fc10000' : '0x016345785d8a0000',
          0,
          0,
        ]
      );
      logger.loading(`Swap ${i + 1} 发出，${pair.from} -> ${pair.to}，金额：${pair.amount}，等待确认...`);
      const tx = await contract.multicall(
        Math.floor(Date.now() / 1000),
        [ethers.concat(['0x04e45aaf', data])],
        { gasLimit: 219249, gasPrice: 0 }
      );
      await tx.wait();
      logger.success(`Swap ${i + 1} 成功: ${tx.hash}，${pair.from} -> ${pair.to}，金额：${pair.amount}`);
      await delay(1000 + Math.random() * 2000);
    }
  } catch (e) {
    logger.error(`Swap 执行异常：${e.message}`);
    if (e.transaction) {
      logger.error(`交易详情：${JSON.stringify(e.transaction, null, 2)}`);
    }
    if (e.receipt) {
      logger.error(`收据：${JSON.stringify(e.receipt, null, 2)}`);
    }
  }
};

// 初始化提供者
const initProvider = (proxy = null) => {
  const options = { chainId: network.chainId, name: network.name };
  if (proxy) {
    logger.info(`使用代理：${proxy}`);
    const agent = new HttpsProxyAgent(proxy);
    return new ethers.JsonRpcProvider(network.rpcUrl, options, {
      fetchOptions: { agent },
      headers: { 'User-Agent': randomUseragent.getRandom() },
    });
  } else {
    logger.info('使用直连模式');
    return new ethers.JsonRpcProvider(network.rpcUrl, options);
  }
};

// 代理格式转换函数
const formatProxy = (proxyInput) => {
  if (!proxyInput.trim()) return null;
  
  try {
    // 如果已经是完整的URL格式，直接返回
    if (proxyInput.startsWith('http://') || proxyInput.startsWith('https://')) {
      return proxyInput.trim();
    }

    // 处理 IP:PORT:USERNAME:PASSWORD 格式
    const parts = proxyInput.split(':');
    if (parts.length === 4) {
      const [ip, port, username, password] = parts;
      return `http://${username}:${password}@${ip}:${port}`;
    }
    
    // 处理 IP:PORT 格式
    if (parts.length === 2) {
      const [ip, port] = parts;
      return `http://${ip}:${port}`;
    }

    // 处理 IP:PORT:USERNAME 格式
    if (parts.length === 3) {
      const [ip, port, username] = parts;
      return `http://${username}@${ip}:${port}`;
    }

    throw new Error('不支持的代理格式');
  } catch (error) {
    logger.error(`代理格式转换失败: ${error.message}`);
    return null;
  }
};

// 获取用户输入的钱包配置
const getWalletConfigs = async () => {
  const configs = [];
  let continueInput = true;

  while (continueInput) {
    console.log('\n=== 添加新钱包配置 ===');
    const privateKey = await question('请输入私钥(直接回车结束输入): ');
    if (!privateKey.trim()) {
      continueInput = false;
      continue;
    }

    const proxy = await question('请输入代理地址(支持格式：\n1. IP:PORT:USERNAME:PASSWORD\n2. IP:PORT\n3. IP:PORT:USERNAME\n4. http(s)://user:pass@host:port\n直接回车则不使用代理): ');
    
    configs.push({
      privateKey: privateKey.trim(),
      proxy: formatProxy(proxy)
    });
  }

  return configs;
};

// 执行单个钱包的操作
const executeWalletOperations = async (walletConfig) => {
  const { privateKey, proxy } = walletConfig;
  const provider = initProvider(proxy);
  const wallet = new ethers.Wallet(privateKey, provider);

  logger.wallet(`当前钱包地址：${wallet.address}`);
  if (proxy) {
    logger.info(`使用代理：${proxy}`);
  } else {
    logger.info('使用直连模式');
  }

  try {
    await claimFaucet(wallet, proxy);
    await delay(2000);
    await performCheckIn(wallet, proxy);
    await delay(2000);
    await transferPHRS(wallet, provider);
    await delay(2000);
    await performSwap(wallet, provider);
    logger.success(`钱包 ${wallet.address} 所有操作执行完毕`);
  } catch (err) {
    logger.error(`钱包 ${wallet.address} 执行失败：${err.message}`);
  }
};

// 主函数
const main = async () => {
  printBanner();

  try {
    // 获取所有钱包配置
    const walletConfigs = await getWalletConfigs();
    
    if (walletConfigs.length === 0) {
      logger.error('未输入任何钱包配置');
      return;
    }

    logger.info(`共配置 ${walletConfigs.length} 个钱包`);

    // 依次执行每个钱包的操作
    for (let i = 0; i < walletConfigs.length; i++) {
      logger.info(`\n开始执行第 ${i + 1}/${walletConfigs.length} 个钱包的操作`);
      await executeWalletOperations(walletConfigs[i]);
      if (i < walletConfigs.length - 1) {
        logger.info('等待5秒后执行下一个钱包...');
        await delay(5000);
      }
    }

    logger.success('所有钱包操作执行完毕');
  } catch (err) {
    logger.error(`脚本运行失败：${err.message}`);
  } finally {
    rl.close();
  }
};

// 启动程序
main().catch(err => {
  logger.error(`脚本运行失败：${err.message}`);
  rl.close();
  process.exit(1);
});
