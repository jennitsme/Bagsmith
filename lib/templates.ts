export type MiniAppTemplate = {
  id: string;
  name: string;
  desc: string;
  tags: string[];
  prompt: string;
  defaults: {
    inputMint: string;
    outputMint: string;
    amount: string;
    executeSwap: boolean;
  };
};

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export const MINI_APP_TEMPLATES: MiniAppTemplate[] = [
  {
    id: 'launch-campaign',
    name: 'Launch Campaign Engine',
    desc: 'Quest-based launch campaign with reward unlock for early adopters.',
    tags: ['Launch', 'Campaign'],
    prompt:
      'Create a launch campaign app where users complete 3 on-chain quests to unlock reward allocation from an airdrop pool.',
    defaults: { inputMint: SOL_MINT, outputMint: USDC_MINT, amount: '1000000', executeSwap: false },
  },
  {
    id: 'loyalty-engine',
    name: 'Trader Loyalty Engine',
    desc: 'Tiered loyalty points and rewards based on trading activity.',
    tags: ['Loyalty', 'Rewards'],
    prompt:
      'Create a loyalty app with tiered rewards and volume-weighted points for repeat traders.',
    defaults: { inputMint: SOL_MINT, outputMint: USDC_MINT, amount: '1000000', executeSwap: false },
  },
  {
    id: 'referral-loop',
    name: 'Viral Referral Loop',
    desc: 'Users invite friends to earn a percentage of trading fees with measurable conversion.',
    tags: ['Referral', 'Growth'],
    prompt:
      'Create a referral mini-app where inviters earn 5% of trading fees from invited users for 30 days, include anti-abuse checks and leaderboard outputs.',
    defaults: { inputMint: SOL_MINT, outputMint: USDC_MINT, amount: '1000000', executeSwap: false },
  },
  {
    id: 'gated-access',
    name: 'NFT Gated Alpha',
    desc: 'Only eligible holders can access the premium route and actions.',
    tags: ['Gated Access', 'NFT'],
    prompt:
      'Create a gated-access mini-app that grants premium actions only to holders of an approved NFT collection and logs allow/deny events.',
    defaults: { inputMint: SOL_MINT, outputMint: USDC_MINT, amount: '1000000', executeSwap: false },
  },
  {
    id: 'tipping',
    name: 'Token Tipping Bot',
    desc: 'Enable creator tipping with configurable rules and fee split.',
    tags: ['Tipping', 'Social'],
    prompt:
      'Create a tipping mini-app where users can tip creators, apply 1% protocol fee, and show total tipped amount per creator.',
    defaults: { inputMint: SOL_MINT, outputMint: USDC_MINT, amount: '1000000', executeSwap: false },
  },
];
