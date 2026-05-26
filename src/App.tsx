import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Clone, ContactShadows, Float, OrbitControls, Preload, useGLTF } from '@react-three/drei';
import type { ThreeElements, ThreeEvent } from '@react-three/fiber';
import { BrowserProvider, Contract, isError, parseEther } from 'ethers';

type ShoeId = 'shoe1' | 'shoe2' | 'shoe3' | 'shoe4' | 'shoe5' | 'shoe6';
type Page = 'home' | 'store' | 'about' | 'process' | 'my-nfts';
type Lang = 'it' | 'en';

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: 'accountsChanged' | 'chainChanged', listener: (...args: unknown[]) => void) => void;
  removeListener: (event: 'accountsChanged' | 'chainChanged', listener: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

type ShoeData = {
  id: ShoeId;
  name: string;
  modelPath:
    | '/Shoe1.glb'
    | '/Shoe2.glb'
    | '/Shoe3.glb'
    | '/Shoe4.glb'
    | '/Shoe5.glb'
    | '/Shoe6.glb';
  homePosition: [number, number, number];
  detailPosition: [number, number, number];
  detailScale: number;
  serial: string;
  edition: string;
  rarity: string;
  style: string;
  material: string;
  palette: string;
  supply: string;
  price: string;
  utility: string;
  status: string;
  description: string;
  traits: string[];
};

const SHOE_HOME_ROTATION: [number, number, number] = [0, 1.57, 0];
const SHOE_HOME_SCALE = 0.145;
const SHOE_DETAIL_ROTATION: [number, number, number] = [0, 1.57, 0];
const LEFT_COLUMN_X = -0.18;
const RIGHT_COLUMN_X = 0.2;

type ShoeLocalizedFields = Pick<
  ShoeData,
  'edition' | 'rarity' | 'style' | 'material' | 'palette' | 'supply' | 'utility' | 'status' | 'description' | 'traits'
>;

const SHOES: ShoeData[] = [
  {
    id: 'shoe1',
    name: 'Demetra Genesis',
    modelPath: '/Shoe1.glb',
    homePosition: [LEFT_COLUMN_X, -0.08, -0.38],
    detailPosition: [0, -0.22, 0],
    detailScale: 1.12,
    serial: 'DMT-001',
    edition: 'Drop Genesis',
    rarity: 'Icona Core',
    style: 'Esposizione boutique a pavimento',
    material: 'Pelle / pannellature opache',
    palette: 'Viola midnight / ossidiana / blu elettrico',
    supply: '120 edizioni',
    price: '0.01 ETH',
    utility: 'Accesso holder Genesis',
    status: 'Anteprima mint',
    description:
      'La prima sneaker signature della collezione Demetra, pensata come pezzo centrale dell’esperienza store.',
    traits: ['Silhouette low-top', 'Fianchi opachi', 'Metadata launch da collezione', 'Hero piece dello storefront']
  },
  {
    id: 'shoe2',
    name: 'Demetra Elevate',
    modelPath: '/Shoe2.glb',
    homePosition: [LEFT_COLUMN_X, 0.01, -0.38],
    detailPosition: [0, -0.19, 0],
    detailScale: 1.12,
    serial: 'DMT-002',
    edition: 'Drop Genesis',
    rarity: 'High Shelf',
    style: 'Posizionamento boutique rialzato',
    material: 'Pelle mista / suola scolpita',
    palette: 'Viola royal / cobalto / nero carbonio',
    supply: '75 edizioni',
    price: '0.01 ETH',
    utility: 'Priorita sui futuri drop',
    status: 'Release curata',
    description:
      'Una silhouette posizionata più in alto, progettata per emergere subito nella stanza con un profilo più collector.',
    traits: ['Suola platform rialzata', 'Punta più decisa', 'Run limitata da collezione', 'Slot premium a scaffale']
  },
  {
    id: 'shoe3',
    name: 'Demetra Apex',
    modelPath: '/Shoe3.glb',
    homePosition: [LEFT_COLUMN_X, 0.095, -0.38],
    detailPosition: [0, -0.19, 0],
    detailScale: 1.12,
    serial: 'DMT-003',
    edition: 'Drop Genesis',
    rarity: 'Upper Tier',
    style: 'Posizione espositiva superiore',
    material: 'Tomaia premium stratificata',
    palette: 'Indigo deep / viola neon / black chrome',
    supply: '40 edizioni',
    price: '0.01 ETH',
    utility: 'Accesso collector top-tier',
    status: 'Selezione vault',
    description:
      'Un modello collocato nella fascia più alta, pensato per risultare più raro ed esclusivo rispetto al resto della lineup.',
    traits: ['Rarita top shelf', 'Costruzione layered upper', 'Tier metadata premium', 'Profilo vault esclusivo']
  },
  {
    id: 'shoe4',
    name: 'Demetra Nova',
    modelPath: '/Shoe4.glb',
    homePosition: [RIGHT_COLUMN_X, -0.1, -0.38],
    detailPosition: [0, -0.22, 0],
    detailScale: 1.12,
    serial: 'DMT-004',
    edition: 'Drop Genesis',
    rarity: 'Core Echo',
    style: 'Esposizione a pavimento lato destro',
    material: 'Pelle / shell ingegnerizzata',
    palette: 'Violet shadow / blue glow / ossidiana',
    supply: '110 edizioni',
    price: '0.01 ETH',
    utility: 'Accesso sconto collector',
    status: 'Anteprima mint',
    description:
      'La controparte specchiata della fascia espositiva inferiore, che estende la lineup verso il lato destro della stanza.',
    traits: ['Silhouette bilanciata', 'Posizionamento lato destro', 'Metadata Genesis', 'Accesso utility collector']
  },
  {
    id: 'shoe5',
    name: 'Demetra Vector',
    modelPath: '/Shoe5.glb',
    homePosition: [RIGHT_COLUMN_X, 0.02, -0.38],
    detailPosition: [0, -0.19, 0],
    detailScale: 1.12,
    serial: 'DMT-005',
    edition: 'Drop Genesis',
    rarity: 'Shelf Echo',
    style: 'Posizionamento rialzato lato destro',
    material: 'Tessuto misto / suola modellata',
    palette: 'Blu elettrico / viola scuro / carbonio',
    supply: '70 edizioni',
    price: '0.01 ETH',
    utility: 'Accesso priority member',
    status: 'Release curata',
    description:
      'Un modello rialzato sul lato destro con la stessa logica espositiva della seconda scarpa, pensato per completare la composizione specchiata.',
    traits: ['Profilo shelf rialzato', 'Run da collezione', 'Layout colonna destra', 'Utility accesso futuro']
  },
  {
    id: 'shoe6',
    name: 'Demetra Zenith',
    modelPath: '/Shoe6.glb',
    homePosition: [RIGHT_COLUMN_X, 0.105, -0.38],
    detailPosition: [0, -0.19, 0],
    detailScale: 1.12,
    serial: 'DMT-006',
    edition: 'Drop Genesis',
    rarity: 'Upper Echo',
    style: 'Posizione espositiva alta a destra',
    material: 'Layered upper / finitura premium',
    palette: 'Indigo black / violet pulse / chrome blue',
    supply: '36 edizioni',
    price: '0.01 ETH',
    utility: 'Accesso holder top-tier',
    status: 'Selezione vault',
    description:
      'La controparte in alto a destra della fascia più rara, che estende la gerarchia verticale sul lato specchiato dello store.',
    traits: ['Tier espositivo alto', 'Posizione showroom specchiata', 'Metadata premium', 'Rarita vault-grade']
  }
];

const EN_SHOE_COPY: Record<ShoeId, ShoeLocalizedFields> = {
  shoe1: {
    edition: 'Genesis Drop',
    rarity: 'Core Icon',
    style: 'Boutique floor display',
    material: 'Leather / matte paneling',
    palette: 'Midnight violet / obsidian / electric blue',
    supply: '120 editions',
    utility: 'Genesis holder access',
    status: 'Mint preview',
    description:
      'The first signature sneaker in the Demetra collection, built as the anchor piece of the store experience.',
    traits: ['Low-top silhouette', 'Matte sidewalls', 'Collector launch metadata', 'Storefront hero piece']
  },
  shoe2: {
    edition: 'Genesis Drop',
    rarity: 'High Shelf',
    style: 'Raised boutique placement',
    material: 'Mixed leather / sculpted sole',
    palette: 'Royal violet / cobalt / carbon black',
    supply: '75 editions',
    utility: 'Priority future drops',
    status: 'Curated release',
    description:
      'A higher-positioned silhouette designed to stand out immediately in the room, with a sharper collector profile.',
    traits: ['Raised platform sole', 'Sharper toe shape', 'Limited collector run', 'Premium shelf slot']
  },
  shoe3: {
    edition: 'Genesis Drop',
    rarity: 'Upper Tier',
    style: 'Top display position',
    material: 'Premium layered upper',
    palette: 'Deep indigo / neon violet / black chrome',
    supply: '40 editions',
    utility: 'Top-tier collector access',
    status: 'Vault selection',
    description:
      'A top-placement model intended to feel rarer and more exclusive, positioned above the rest of the in-store lineup.',
    traits: ['Top shelf rarity', 'Layered upper build', 'Premium metadata tier', 'Exclusive vault profile']
  },
  shoe4: {
    edition: 'Genesis Drop',
    rarity: 'Core Echo',
    style: 'Right-side floor display',
    material: 'Leather / engineered shell',
    palette: 'Violet shadow / blue glow / obsidian',
    supply: '110 editions',
    utility: 'Collector discount access',
    status: 'Mint preview',
    description:
      'A mirrored counterpart to the lower display tier, extending the showroom lineup toward the right side of the room.',
    traits: ['Balanced silhouette', 'Right-side placement', 'Genesis metadata', 'Collector utility access']
  },
  shoe5: {
    edition: 'Genesis Drop',
    rarity: 'Shelf Echo',
    style: 'Right-side raised placement',
    material: 'Mixed textile / molded sole',
    palette: 'Electric blue / dark violet / carbon',
    supply: '70 editions',
    utility: 'Priority member access',
    status: 'Curated release',
    description:
      'A right-side raised model with the same display logic as the second shoe, but positioned to complete the mirrored shelf composition.',
    traits: ['Raised shelf profile', 'Collector run', 'Right-column layout', 'Future access utility']
  },
  shoe6: {
    edition: 'Genesis Drop',
    rarity: 'Upper Echo',
    style: 'Top right display position',
    material: 'Layered upper / premium finish',
    palette: 'Indigo black / violet pulse / chrome blue',
    supply: '36 editions',
    utility: 'Top-tier holder access',
    status: 'Vault selection',
    description:
      'The upper-right counterpart to the rarest display tier, extending the vertical hierarchy across the mirrored side of the store.',
    traits: ['Top display tier', 'Mirrored showroom position', 'Premium metadata', 'Vault-grade rarity']
  }
};

function getLocalizedShoe(shoe: ShoeData, lang: Lang): ShoeData {
  if (lang === 'it') {
    return shoe;
  }

  return {
    ...shoe,
    ...EN_SHOE_COPY[shoe.id]
  };
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isMetaMaskMobileBrowser() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /MetaMaskMobile/i.test(navigator.userAgent);
}

const WALLET_SESSION_KEY = 'demetra.wallet.connected';
const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';
const DEMETRA_COLLECTION_ADDRESS = import.meta.env.VITE_DEMETRA_COLLECTION_ADDRESS?.trim() ?? '';
const DEMETRA_COLLECTION_ABI = [
  'function buyNFT(uint256 tokenId) payable',
  'function ownerOf(uint256 tokenId) view returns (address)'
];
const SHOE_TOKEN_IDS: Record<ShoeId, bigint> = {
  shoe1: 1n,
  shoe2: 2n,
  shoe3: 3n,
  shoe4: 4n,
  shoe5: 5n,
  shoe6: 6n
};

function StoreModel(props: SceneGroupProps) {
  const gltf = useGLTF('/room.glb');
  return <primitive object={gltf.scene} {...props} />;
}

function ShoeModel(
  {
    modelPath,
    ...props
  }: SceneGroupProps & {
    modelPath:
      | '/Shoe1.glb'
      | '/Shoe2.glb'
      | '/Shoe3.glb'
      | '/Shoe4.glb'
      | '/Shoe5.glb'
      | '/Shoe6.glb';
  }
) {
  const gltf = useGLTF(modelPath);
  return <Clone object={gltf.scene} {...props} />;
}

function AppHeader({
  currentPage,
  lang,
  walletAddress,
  walletBusy,
  walletError,
  onNavigate,
  onWalletClick,
  onToggleLanguage
}: {
  currentPage: Page;
  lang: Lang;
  walletAddress: string | null;
  walletBusy: boolean;
  walletError: string | null;
  onNavigate: (page: Page) => void;
  onWalletClick: () => void;
  onToggleLanguage: () => void;
}) {
  const isDarkHeader =
    currentPage === 'home' ||
    currentPage === 'store' ||
    currentPage === 'about' ||
    currentPage === 'process' ||
    currentPage === 'my-nfts';

  return (
    <header
      className={isDarkHeader ? 'site-header site-header-dark' : 'site-header'}
      style={
        isDarkHeader
          ? {
              background: '#090909',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }
          : undefined
      }
    >
      <button
        type="button"
        className="brand-lockup"
        onClick={() => onNavigate('home')}
        style={isDarkHeader ? { color: '#f3efe9' } : undefined}
      >
        <span className="brand-wordmark">DEMETRA</span>
      </button>

      <nav className="site-nav" aria-label="Primary">
        <button
          type="button"
          className={currentPage === 'home' ? 'nav-link is-active' : 'nav-link'}
          onClick={() => onNavigate('home')}
          style={
            isDarkHeader
              ? {
                  color: '#f3efe9',
                  background: currentPage === 'home' ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
                }
              : undefined
          }
        >
          {lang === 'it' ? 'Home' : 'Home'}
        </button>
        <button
          type="button"
          className={currentPage === 'process' ? 'nav-link is-active' : 'nav-link'}
          onClick={() => onNavigate('process')}
          style={
            isDarkHeader
              ? {
                  color: '#f3efe9',
                  background: currentPage === 'process' ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
                }
              : undefined
          }
        >
          {lang === 'it' ? 'Procedura' : 'Process'}
        </button>
        <button
          type="button"
          className={currentPage === 'about' ? 'nav-link is-active' : 'nav-link'}
          onClick={() => onNavigate('about')}
          style={
            isDarkHeader
              ? {
                  color: '#f3efe9',
                  background: currentPage === 'about' ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
                }
              : undefined
          }
        >
          {lang === 'it' ? 'Chi siamo' : 'About'}
        </button>
        <button
          type="button"
          className={currentPage === 'store' ? 'nav-link is-active' : 'nav-link'}
          onClick={() => onNavigate('store')}
          style={
            isDarkHeader
              ? {
                  color: '#f3efe9',
                  background: currentPage === 'store' ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
                }
              : undefined
          }
        >
          {lang === 'it' ? 'Store' : 'Store'}
        </button>
        {walletAddress ? (
          <button
            type="button"
            className={currentPage === 'my-nfts' ? 'nav-link is-active' : 'nav-link'}
            onClick={() => onNavigate('my-nfts')}
            style={
              isDarkHeader
                ? {
                    color: '#f3efe9',
                    background: currentPage === 'my-nfts' ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
                  }
                : undefined
            }
          >
            {lang === 'it' ? 'My NFT' : 'My NFT'}
          </button>
        ) : null}
      </nav>

      <div className="header-actions">
        <button
          type="button"
          className="language-button"
          onClick={onToggleLanguage}
          style={
            isDarkHeader
              ? {
                  background: 'transparent',
                  color: '#f3efe9',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: 'none'
                }
              : undefined
          }
        >
          {lang === 'it' ? 'IT' : 'EN'}
        </button>

        <button
          type="button"
          className="wallet-button"
          onClick={onWalletClick}
          disabled={walletBusy}
          title={walletError ?? undefined}
          style={
            isDarkHeader
              ? {
                  background: 'transparent',
                  color: '#f3efe9',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: 'none'
                }
              : undefined
          }
        >
          {walletBusy
            ? lang === 'it'
              ? 'Connessione...'
              : 'Connecting...'
            : walletAddress
            ? lang === 'it'
              ? `Disconnetti dal sito ${shortenAddress(walletAddress)}`
              : `Disconnect from site ${shortenAddress(walletAddress)}`
            : lang === 'it'
              ? 'Connetti Wallet'
              : 'Connect Wallet'}
        </button>
      </div>
    </header>
  );
}

function HomePage({
  lang,
  onEnterStore,
  onOpenAbout,
  onOpenProcess
}: {
  lang: Lang;
  onEnterStore: () => void;
  onOpenAbout: () => void;
  onOpenProcess: () => void;
}) {
  return (
    <main className="landing-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-kicker">Demetra Running / Luxury Urban NFT</p>
          <h1>FUTURE IS OUR DESIGN</h1>
          <span className="home-divider" />
          <p>
            {lang === 'it'
              ? 'Calzature da corsa moderne e luxury urban realizzate con materiali riciclati, presentate in uno showroom 3D NFT e collegate a edizioni fisiche limitate.'
              : 'Modern running and luxury urban footwear made with recycled materials, presented through a 3D NFT showroom and linked to limited physical editions.'}
          </p>
        </div>

        <div className="home-hero-stage">
          <h1 className="home-hero-floating-title">FUTURE IS OUR DESIGN</h1>
          <div className="home-pedestal" />
          <img
            className="home-hero-image"
            src="/1.png"
            alt="Demetra featured sneaker"
          />
          <div className="home-showroom-glow" aria-hidden="true" />
        </div>
      </section>

      <section className="home-editorial-grid" id="manifesto">
        <article className="editorial-tile tile-detail">
          <div className="tile-image texture-panel">
            <img src="/2.png" alt="Demetra crafted detail" className="tile-image-asset" />
          </div>
          <div className="tile-copy">
            <h2>CRAFTED DIFFERENTLY</h2>
            <p>
              {lang === 'it'
                ? 'Materiali riciclati, NFT numerati e un modello di uscita fisica in edizione limitata.'
                : 'Recycled materials, numbered NFTs and a physical limited edition release model.'}
            </p>
            <button type="button" className="hero-inline-link" onClick={onOpenProcess}>
              {lang === 'it' ? 'Scopri di più' : 'Discover More'}
            </button>
          </div>
        </article>

        <article className="editorial-tile tile-story">
          <div className="tile-image portal-panel">
            <img src="/3.png" alt="Demetra visionary story" className="tile-image-asset" />
          </div>
          <div className="tile-copy">
            <h2>BUILT FOR VISIONARIES</h2>
            <p>
              {lang === 'it'
                ? 'Demetra unisce design running contemporaneo, direzione luxury urban e una cultura del materiale più responsabile.'
                : 'Demetra blends modern running design, luxury urban direction and a more responsible material culture.'}
            </p>
            <button type="button" className="hero-inline-link" onClick={onOpenAbout}>
              {lang === 'it' ? 'Scopri la nostra storia' : 'Learn Our Story'}
            </button>
          </div>
        </article>

        <article className="editorial-tile tile-collection">
          <div className="tile-image lineup-panel">
            <img src="/4.png" alt="Demetra new collection" className="tile-image-asset" />
          </div>
          <div className="tile-copy">
            <h2>{lang === 'it' ? 'NUOVA COLLEZIONE' : 'NEW COLLECTION'}</h2>
            <p>
              {lang === 'it'
                ? 'NFT numerati in edizione limitata che sbloccano l’accesso alle scarpe fisiche Demetra in release esclusiva.'
                : 'Limited numbered NFTs that unlock access to Demetra physical sneakers in exclusive edition.'}
            </p>
            <button type="button" className="hero-inline-link" onClick={onEnterStore}>
              {lang === 'it' ? 'Entra nello store' : 'Shop Now'}
            </button>
          </div>
        </article>
      </section>

      <section className="home-benefits-band">
        <article>
          <strong>{lang === 'it' ? 'Qualita Premium' : 'Premium Quality'}</strong>
          <span>{lang === 'it' ? 'Materiali selezionati' : 'Selected materials'}</span>
        </article>
        <article>
          <strong>{lang === 'it' ? 'Utilita NFT' : 'NFT Utility'}</strong>
          <span>{lang === 'it' ? 'Accesso limited edition' : 'Limited edition access'}</span>
        </article>
        <article>
          <strong>{lang === 'it' ? 'Pagamenti Sicuri' : 'Secure Payments'}</strong>
          <span>{lang === 'it' ? 'Flusso basato su wallet' : 'Wallet based flow'}</span>
        </article>
        <article>
          <strong>{lang === 'it' ? 'Esperienza Store' : 'Store Experience'}</strong>
          <span>{lang === 'it' ? 'Showroom NFT 3D immersivo' : 'Immersive 3D NFT showroom'}</span>
        </article>
      </section>

      <SiteFooter lang={lang} />
    </main>
  );
}

function SiteFooter({ lang }: { lang: Lang }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="site-footer-brand">
          <span className="site-footer-kicker">{lang === 'it' ? 'Contatti Demetra' : 'Demetra Contact'}</span>
          <strong>DEMETRA</strong>
          <p>
            {lang === 'it'
              ? 'Calzature running moderne e luxury urban costruite con materiali riciclati e collegate ad accessi NFT numerati.'
              : 'Modern running and luxury urban footwear built with recycled materials and connected to numbered NFT access.'}
          </p>
        </div>

        <div className="site-footer-contact">
          <div>
            <span>Email</span>
            <a href="mailto:info@demetra-studio.com">info@demetra-studio.com</a>
          </div>
          <div>
            <span>{lang === 'it' ? 'Telefono' : 'Phone'}</span>
            <a href="tel:+390212345678">+39 02 1234 5678</a>
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>{lang === 'it' ? 'Showroom 3D / piattaforma NFT limited edition' : '3D showroom / NFT limited edition platform'}</span>
        <span>{lang === 'it' ? 'Sviluppato da Jonathan Ardelean' : 'Developed by Jonathan Ardelean'}</span>
      </div>
    </footer>
  );
}

function ProcessPage({ lang, onEnterStore }: { lang: Lang; onEnterStore: () => void }) {
  return (
    <main className="process-page">
      <section className="process-hero">
        <div className="process-hero-copy">
          <p className="process-kicker">{lang === 'it' ? 'Demetra / Come funziona' : 'Demetra / How It Works'}</p>
          <h1>
            {lang === 'it'
              ? 'Da un NFT numerato a una scarpa fisica Demetra in edizione limitata.'
              : 'From a numbered NFT to a limited physical Demetra sneaker.'}
          </h1>
          <p>
            {lang === 'it'
              ? 'La piattaforma Demetra usa gli NFT come livello di accesso per le release più esclusive. Ogni token è numerato, limited edition e collegato alla richiesta della corrispondente scarpa fisica.'
              : 'The Demetra platform uses NFTs as the access layer for its most exclusive releases. Each token is numbered, limited edition and connected to the request flow for the real physical pair.'}
          </p>
        </div>
        <div className="process-hero-image-wrap">
          <img src="/8.png" alt="Demetra NFT process visual" className="process-hero-image" />
        </div>
      </section>

      <section className="process-grid">
        <article className="process-card">
          <span>01</span>
          <h2>{lang === 'it' ? 'Acquista l’NFT' : 'Buy the NFT'}</h2>
          <p>
            {lang === 'it'
              ? 'L’utente entra nello showroom 3D, collega il wallet e acquista un NFT Demetra direttamente dalla piattaforma. Ogni token appartiene a una release limitata e numerata.'
              : 'The user enters the 3D showroom, connects a wallet and buys a Demetra NFT directly from the platform. Every token belongs to a limited and numbered release.'}
          </p>
        </article>

        <article className="process-card">
          <span>02</span>
          <h2>{lang === 'it' ? 'Ricevi l’edizione numerata' : 'Receive the numbered edition'}</h2>
          <p>
            {lang === 'it'
              ? 'Dopo l’acquisto, l’NFT diventa la prova di proprietà di quella edizione. Il possessore riceve un asset digitale collezionabile collegato a un numero preciso della release.'
              : 'After purchase, the NFT works as the proof of ownership for that edition. The holder receives a collectible digital asset tied to a specific number inside the release.'}
          </p>
        </article>

        <article className="process-card">
          <span>03</span>
          <h2>{lang === 'it' ? 'Richiedi la scarpa fisica' : 'Request the physical sneaker'}</h2>
          <p>
            {lang === 'it'
              ? 'Solo il possessore dell’NFT può inviare la richiesta per la scarpa fisica Demetra e accedere al paio corrispondente in edizione limitata tramite il sito.'
              : 'Only the NFT holder can submit the request for the physical Demetra sneaker and access the corresponding limited edition pair through the site.'}
          </p>
        </article>
      </section>

      <section className="process-band">
        <div className="process-band-copy">
          <p className="process-kicker">{lang === 'it' ? 'Perche questo modello' : 'Why This Model'}</p>
          <h2>{lang === 'it' ? 'Prima la proprietà digitale, poi l’accesso fisico.' : 'Digital ownership first, physical access after.'}</h2>
          <p>
            {lang === 'it'
              ? 'L’NFT è insieme collezionabile e utilità. Definisce la scarsità, mantiene ogni edizione numerata e rende la scarpa fisica disponibile solo agli utenti che hanno acquistato il token.'
              : 'The NFT is both collectible and utility. It defines scarcity, keeps every edition numbered and makes the physical sneaker available only to the users who purchased the token.'}
          </p>
        </div>

        <div className="process-band-points">
          <article>
            <strong>{lang === 'it' ? 'Limited Edition' : 'Limited Edition'}</strong>
            <p>{lang === 'it' ? 'Ogni drop è limitato e pubblicato come edizione esclusiva numerata.' : 'Each drop is capped and released as an exclusive numbered edition.'}</p>
          </article>
          <article>
            <strong>{lang === 'it' ? 'Logica Numerata' : 'Numbered Logic'}</strong>
            <p>{lang === 'it' ? 'L’NFT identifica una posizione precisa all’interno della release limitata.' : 'The NFT identifies a precise position inside the limited release.'}</p>
          </article>
          <article>
            <strong>{lang === 'it' ? 'Richiesta Fisica' : 'Physical Claim'}</strong>
            <p>{lang === 'it' ? 'Solo chi compra l’NFT può richiedere la scarpa fisica corrispondente tramite Demetra.' : 'Only the NFT buyer can request the matching physical sneaker through Demetra.'}</p>
          </article>
        </div>
      </section>

      <section className="process-cta">
        <strong>{lang === 'it' ? 'Entra nello showroom 3D e sblocca una Demetra numerata in edizione limitata.' : 'Enter the 3D showroom and unlock a numbered Demetra limited edition.'}</strong>
        <button type="button" className="hero-outline-button" onClick={onEnterStore}>
          {lang === 'it' ? 'Entra nello store' : 'Enter Store'}
        </button>
      </section>

      <SiteFooter lang={lang} />
    </main>
  );
}

function AboutPage({ lang }: { lang: Lang }) {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-copy">
          <p className="about-kicker">{lang === 'it' ? 'Demetra / Storia del brand' : 'Demetra / Company Story'}</p>
          <h1>{lang === 'it' ? 'Calzature running moderne e luxury urban create con materiali riciclati.' : 'Modern running and luxury urban footwear made with recycled materials.'}</h1>
          <p className="about-lead">
            {lang === 'it'
              ? 'Demetra nasce per unire performance running contemporanea, identità luxury urban e un approccio più responsabile al materiale, costruito attorno a input riciclati.'
              : 'Demetra was created to merge contemporary running performance, luxury urban identity and a more responsible material approach built around recycled inputs.'}
          </p>
        </div>

        <div className="about-hero-image-wrap">
          <img
            src="/6.png"
            alt="Demetra about us visual"
            className="about-hero-image"
          />
        </div>
      </section>

      <section className="about-story-grid">
        <article className="about-story-panel">
          <span>{lang === 'it' ? 'Origine' : 'Origin'}</span>
          <h2>{lang === 'it' ? 'Dall’esperienza fashion a una nuova direzione running luxury.' : 'From fashion experience to a new running luxury direction.'}</h2>
          <p>
            {lang === 'it'
              ? 'Demetra nasce dall’idea che un brand di sneaker contemporaneo possa essere premium, urbano e moderno, prendendo allo stesso tempo sul serio materiali riciclati e scelte a minore impatto.'
              : 'Demetra was born from the idea that a contemporary sneaker brand could feel premium, urban and modern while also taking recycled materials and lower-impact choices seriously.'}
          </p>
        </article>

        <article className="about-story-panel">
          <span>{lang === 'it' ? 'Materiali' : 'Materials'}</span>
          <h2>{lang === 'it' ? 'I materiali di recupero diventano nuove superfici.' : 'Waste streams become new surfaces.'}</h2>
          <p>
            {lang === 'it'
              ? 'Il progetto sviluppa calzature usando fonti riciclate e trasformate, rendendo scarti e materiali recuperati parte del linguaggio estetico e costruttivo del prodotto.'
              : 'The project develops footwear using recycled and transformed material sources, turning waste and recovered inputs into part of the design language of the product.'}
          </p>
        </article>
      </section>

      <section className="about-materials-band">
        <div className="about-materials-visual">
          <img
            src="/7.png"
            alt="Demetra materials visual"
            className="about-materials-image"
          />
        </div>

        <div className="about-materials-copy">
          <p className="about-kicker">{lang === 'it' ? 'Come funziona Demetra' : 'How Demetra Works'}</p>
          <h2>{lang === 'it' ? 'Materiali riciclati, accesso esclusivo e una storia di prodotto più forte.' : 'Recycled materials, exclusive access and a stronger product story.'}</h2>
          <p>
            {lang === 'it'
              ? 'Demetra considera i materiali riciclati come parte dell’identità stessa della scarpa. L’obiettivo non è solo la sostenibilità, ma un prodotto che appaia avanzato, esclusivo e chiaramente posizionato.'
              : 'Demetra treats recycled materials as part of the identity of the shoe itself. The goal is not only sustainability, but a product that feels advanced, exclusive and clearly positioned.'}
          </p>

          <div className="about-points">
            <article>
              <strong>{lang === 'it' ? 'Input Riciclati' : 'Recycled Inputs'}</strong>
              <p>{lang === 'it' ? 'Materiali recuperati e trasformati entrano nella costruzione della sneaker.' : 'Recovered and transformed materials become part of the construction of the sneaker.'}</p>
            </article>
            <article>
              <strong>{lang === 'it' ? 'Impatto Ridotto' : 'Reduced Impact'}</strong>
              <p>{lang === 'it' ? 'Il progetto punta a ridurre l’intensità dello spreco mantenendo un linguaggio premium.' : 'The project aims to reduce waste intensity while preserving a premium design language.'}</p>
            </article>
            <article>
              <strong>{lang === 'it' ? 'Estensione Digitale' : 'Digital Extension'}</strong>
              <p>{lang === 'it' ? 'Il layer NFT sblocca l’accesso limited edition e il diritto a richiedere il paio fisico.' : 'The NFT layer unlocks limited edition access and the right to request the physical pair.'}</p>
            </article>
          </div>
        </div>
      </section>

      <SiteFooter lang={lang} />
    </main>
  );
}

function MyNftPage({
  lang,
  walletAddress,
  onOpenShoe,
  onEnterStore
}: {
  lang: Lang;
  walletAddress: string | null;
  onOpenShoe: (shoeId: ShoeId) => void;
  onEnterStore: () => void;
}) {
  const [ownedShoeIds, setOwnedShoeIds] = useState<ShoeId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadOwnedNfts = async () => {
      if (!walletAddress || !window.ethereum || !DEMETRA_COLLECTION_ADDRESS) {
        setOwnedShoeIds([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(DEMETRA_COLLECTION_ADDRESS, DEMETRA_COLLECTION_ABI, provider);
        const ownedEntries = await Promise.all(
          SHOES.map(async (shoe) => {
            try {
              const owner = (await contract.ownerOf(SHOE_TOKEN_IDS[shoe.id])) as string;
              return owner.toLowerCase() === walletAddress.toLowerCase() ? shoe.id : null;
            } catch {
              return null;
            }
          })
        );

        if (cancelled) {
          return;
        }

        setOwnedShoeIds(ownedEntries.filter((shoeId): shoeId is ShoeId => shoeId !== null));
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        console.error('Failed to load owned NFTs', loadError);
        setError(
          lang === 'it'
            ? 'Non è stato possibile leggere gli NFT posseduti.'
            : 'Unable to read the owned NFTs.'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadOwnedNfts();

    return () => {
      cancelled = true;
    };
  }, [lang, walletAddress]);

  const ownedShoes = SHOES.filter((shoe) => ownedShoeIds.includes(shoe.id));

  return (
    <main className="my-nfts-page">
      <section className="my-nfts-hero">
        <p className="section-kicker">{lang === 'it' ? 'Wallet / My NFT' : 'Wallet / My NFT'}</p>
        <h1>{lang === 'it' ? 'I tuoi NFT Demetra.' : 'Your Demetra NFTs.'}</h1>
        <p>
          {walletAddress
            ? lang === 'it'
              ? `Wallet connesso: ${shortenAddress(walletAddress)}`
              : `Connected wallet: ${shortenAddress(walletAddress)}`
            : lang === 'it'
              ? 'Connetti il wallet per vedere gli NFT acquistati.'
              : 'Connect your wallet to see the purchased NFTs.'}
        </p>
      </section>

      {loading ? (
        <section className="my-nfts-empty">
          <strong>{lang === 'it' ? 'Caricamento NFT in corso...' : 'Loading NFTs...'}</strong>
        </section>
      ) : error ? (
        <section className="my-nfts-empty">
          <strong>{error}</strong>
        </section>
      ) : ownedShoes.length === 0 ? (
        <section className="my-nfts-empty">
          <strong>{lang === 'it' ? 'Nessun NFT Demetra trovato in questo wallet.' : 'No Demetra NFTs found for this wallet.'}</strong>
          <p>
            {lang === 'it'
              ? 'Acquista una sneaker dallo store per vederla comparire qui.'
              : 'Buy a sneaker from the store to see it appear here.'}
          </p>
          <button type="button" className="hero-outline-button" onClick={onEnterStore}>
            {lang === 'it' ? 'Vai allo Store' : 'Go to Store'}
          </button>
        </section>
      ) : (
        <section className="my-nfts-grid">
          {ownedShoes.map((shoe) => {
            const localizedShoe = getLocalizedShoe(shoe, lang);

            return (
              <article key={shoe.id} className="my-nft-card">
                <div className="my-nft-image-wrap">
                  <img src={`/${shoe.modelPath.replace('.glb', '.png').replace('/S', 'S')}`} alt={localizedShoe.name} className="my-nft-image" />
                </div>
                <div className="my-nft-copy">
                  <p className="detail-kicker">{shoe.serial}</p>
                  <h2 className={shoe.id === 'shoe2' ? 'my-nft-title is-inline' : 'my-nft-title'}>{localizedShoe.name}</h2>
                  <p>{localizedShoe.description}</p>
                  <div className="my-nft-meta">
                    <span>{localizedShoe.edition}</span>
                    <span>{localizedShoe.rarity}</span>
                    <span>{localizedShoe.price}</span>
                  </div>
                  <div className="my-nft-actions">
                    <button type="button" className="hero-outline-button" onClick={() => onOpenShoe(shoe.id)}>
                      {lang === 'it' ? 'Apri NFT' : 'Open NFT'}
                    </button>
                    <button type="button" className="hero-outline-button my-nft-coming-soon" disabled>
                      {lang === 'it' ? 'Richiedi Scarpa · Coming Soon' : 'Claim Shoe · Coming Soon'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <SiteFooter lang={lang} />
    </main>
  );
}

function InteractiveShoe({
  shoe,
  active,
  onHover,
  onLeave,
  onSelect
}: {
  shoe: ShoeData;
  active: boolean;
  onHover: (shoeId: ShoeId) => void;
  onLeave: () => void;
  onSelect: (shoeId: ShoeId) => void;
}) {
  const handlePointerEnter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = 'pointer';
    onHover(shoe.id);
  };

  const handlePointerLeave = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = 'default';
    onLeave();
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = 'default';
    onSelect(shoe.id);
  };

  return (
    <group>
      <group
        position={[
          shoe.homePosition[0],
          shoe.homePosition[1],
          shoe.homePosition[2] + (active ? 0.022 : 0)
        ]}
        rotation={[
          SHOE_HOME_ROTATION[0],
          SHOE_HOME_ROTATION[1] + (active ? 0.08 : 0),
          SHOE_HOME_ROTATION[2]
        ]}
        scale={active ? SHOE_HOME_SCALE * 1.04 : SHOE_HOME_SCALE}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        <ShoeModel modelPath={shoe.modelPath} />
      </group>
      {active ? (
        <mesh
          position={[
            shoe.homePosition[0],
            shoe.homePosition[1] - 0.055,
            shoe.homePosition[2] + 0.03
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.03, 0.065, 48]} />
          <meshBasicMaterial color="#8f66ff" transparent opacity={0.78} />
        </mesh>
      ) : null}
    </group>
  );
}

function ShelfShoes({
  activeShoeId,
  onHover,
  onLeave,
  onSelect
}: {
  activeShoeId: ShoeId | null;
  onHover: (shoeId: ShoeId) => void;
  onLeave: () => void;
  onSelect: (shoeId: ShoeId) => void;
}) {
  return (
    <group>
      {SHOES.map((shoe) => (
        <InteractiveShoe
          key={shoe.id}
          shoe={shoe}
          active={activeShoeId === shoe.id}
          onHover={onHover}
          onLeave={onLeave}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

function StorePage({ lang, onSelect }: { lang: Lang; onSelect: (shoeId: ShoeId) => void }) {
  const [activeShoeId, setActiveShoeId] = useState<ShoeId | null>(null);
  const [diagnosticStep, setDiagnosticStep] = useState(1);
  const [isPhoneViewport, setIsPhoneViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia('(max-width: 980px)').matches;
  });

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default';
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 980px)');
    const updateViewportMode = () => setIsPhoneViewport(mediaQuery.matches);

    updateViewportMode();
    mediaQuery.addEventListener('change', updateViewportMode);

    return () => {
      mediaQuery.removeEventListener('change', updateViewportMode);
    };
  }, []);

  const activeShoe = activeShoeId ? SHOES.find((shoe) => shoe.id === activeShoeId) ?? null : null;
  const useMetaMaskDiagnostic = isPhoneViewport && isMetaMaskMobileBrowser();
  const showRoom = !useMetaMaskDiagnostic || diagnosticStep >= 3;
  const showShadows = !useMetaMaskDiagnostic || diagnosticStep >= 4;
  const showShoes = !useMetaMaskDiagnostic || diagnosticStep >= 5;
  const showControls = !useMetaMaskDiagnostic || diagnosticStep >= 6;
  const diagnosticLabels = lang === 'it'
    ? ['Canvas', 'Luci', 'Room', 'Ombre', 'Scarpe', 'Controlli']
    : ['Canvas', 'Lights', 'Room', 'Shadows', 'Shoes', 'Controls'];

  return (
    <main className="store-page">
      <aside className="store-sidebar store-sidebar-reimagined">
        <div className="store-feature-panel">
          <img src="/5.png" alt="Demetra store feature" className="store-column-image" />
          <div className="store-title-block store-title-overlay">
            <p className="section-kicker">{lang === 'it' ? 'Esperienza Store' : 'Store Experience'}</p>
            <div className="store-word-stack" aria-hidden="true">
              <span>SHOW</span>
              <span>ROOM</span>
            </div>
            <h1>{lang === 'it' ? 'Entra nello showroom 3D Demetra.' : 'Enter the Demetra 3D showroom.'}</h1>
            <p>
              {lang === 'it'
                ? 'Esplora le sneaker, apri le pagine NFT e accedi ai modelli in edizione limitata che sbloccano la corrispondente scarpa fisica Demetra.'
                : 'Explore the sneakers, open the NFT pages and access the limited edition models that unlock the corresponding physical Demetra shoe.'}
            </p>
          </div>
        </div>
      </aside>

      <section className="store-scene store-scene-reimagined" aria-label="3D Demetra store">
        <div className="store-overlay">
          <span>{lang === 'it' ? 'Store 3D' : '3D Store'}</span>
          <p>
            {useMetaMaskDiagnostic
              ? lang === 'it'
                ? `Modalita diagnostica MetaMask iPhone: step ${diagnosticStep}/6.`
                : `MetaMask iPhone diagnostic mode: step ${diagnosticStep}/6.`
              : activeShoe
                ? (lang === 'it' ? `Apri i dettagli NFT di ${activeShoe.name}` : `Open ${activeShoe.name} NFT details`)
                : lang === 'it'
                  ? 'Passa sopra una sneaker e clicca per vedere il suo NFT numerato.'
                  : 'Hover a sneaker and click to inspect its numbered NFT.'}
          </p>
        </div>
        {useMetaMaskDiagnostic ? (
          <div className="store-diagnostic-panel">
            <strong>{lang === 'it' ? 'Test MetaMask iPhone' : 'MetaMask iPhone Test'}</strong>
            <div className="store-diagnostic-actions">
              {diagnosticLabels.map((label, index) => {
                const step = index + 1;

                return (
                  <button
                    key={label}
                    type="button"
                    className={diagnosticStep === step ? 'store-diagnostic-button is-active' : 'store-diagnostic-button'}
                    onClick={() => setDiagnosticStep(step)}
                  >
                    {step}. {label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="store-scene-frame frame-top-left" aria-hidden="true" />
        <div className="store-scene-frame frame-bottom-right" aria-hidden="true" />
        <Canvas
          key={useMetaMaskDiagnostic ? `store-metamask-step-${diagnosticStep}` : isPhoneViewport ? 'store-mobile' : 'store-desktop'}
          camera={
            isPhoneViewport
              ? { position: [4.1, 4, 5.25], fov: 30 }
              : { position: [4.4, 4.05, 5.55], fov: 30 }
          }
          dpr={useMetaMaskDiagnostic ? 1 : isPhoneViewport ? [1, 1.5] : [1, 2]}
          frameloop="always"
          gl={
            useMetaMaskDiagnostic
              ? {
                  antialias: false,
                  alpha: false,
                  powerPreference: 'low-power',
                  stencil: false,
                  preserveDrawingBuffer: false
                }
              : undefined
          }
          style={{ width: '100%', height: '100%' }}
        >
          <color attach="background" args={['#090909']} />
          <ambientLight intensity={useMetaMaskDiagnostic ? 0.78 : 0.88} />
          {(!useMetaMaskDiagnostic || diagnosticStep >= 2) ? (
            <>
              <directionalLight position={[8, 10, 6]} intensity={useMetaMaskDiagnostic ? 1.1 : 2} color="#d0c5ff" />
              <directionalLight position={[-6, 8, -3]} intensity={useMetaMaskDiagnostic ? 0.7 : 1.1} color="#5b78ff" />
            </>
          ) : null}
          <group position={[0, 0.05, 0]} scale={isPhoneViewport ? 3.4 : 2.92}>
            {showRoom ? <StoreModel /> : null}
            {showShoes ? (
              <ShelfShoes
                activeShoeId={activeShoeId}
                onHover={setActiveShoeId}
                onLeave={() => setActiveShoeId(null)}
                onSelect={onSelect}
              />
            ) : null}
          </group>
          {showControls ? (
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              enableRotate
              minDistance={4}
              maxDistance={7}
              minPolarAngle={isPhoneViewport ? 1.02 : 0.95}
              maxPolarAngle={isPhoneViewport ? 1.28 : 1.35}
            />
          ) : null}
          {showShadows ? (
            <ContactShadows
              position={[0, -3.1, 0]}
              opacity={0.35}
              scale={25}
              blur={2.5}
              far={6}
              color="#382f66"
            />
          ) : null}
          {!useMetaMaskDiagnostic ? <Preload all /> : null}
        </Canvas>
      </section>

      <SiteFooter lang={lang} />
    </main>
  );
}

function ShoeDetail({
  lang,
  shoe,
  walletAddress,
  onBack
}: {
  lang: Lang;
  shoe: ShoeData;
  walletAddress: string | null;
  onBack: () => void;
}) {
  const localizedShoe = getLocalizedShoe(shoe, lang);
  const [isCompactDetailViewport, setIsCompactDetailViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia('(max-width: 980px)').matches;
  });
  const referenceImageMap: Partial<Record<ShoeId, { src: string; alt: string }>> = {
    shoe1: {
      src: '/Shoe1.png',
      alt: 'Demetra Genesis shoe reference sheet'
    },
    shoe2: {
      src: '/Shoe2.png',
      alt: 'Demetra Elevate shoe reference sheet'
    },
    shoe3: {
      src: '/Shoe3.png',
      alt: 'Demetra Apex shoe reference sheet'
    },
    shoe4: {
      src: '/Shoe4.png',
      alt: 'Demetra Nova shoe reference sheet'
    },
    shoe5: {
      src: '/Shoe5.png',
      alt: 'Demetra Vector shoe reference sheet'
    },
    shoe6: {
      src: '/Shoe6.png',
      alt: 'Demetra Zenith shoe reference sheet'
    }
  };

  const referenceImage = referenceImageMap[shoe.id];
  const canShowReferenceImage = Boolean(referenceImage);
  const [showReferenceImage, setShowReferenceImage] = useState(() => canShowReferenceImage);
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyMessage, setBuyMessage] = useState<string | null>(null);
  const [buyMessageTone, setBuyMessageTone] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    setBuyBusy(false);
    setBuyMessage(null);
    setBuyMessageTone(null);
  }, [shoe.id]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 980px)');
    const updateViewportMode = () => setIsCompactDetailViewport(mediaQuery.matches);

    updateViewportMode();
    mediaQuery.addEventListener('change', updateViewportMode);

    return () => {
      mediaQuery.removeEventListener('change', updateViewportMode);
    };
  }, []);

  useEffect(() => {
    setShowReferenceImage(canShowReferenceImage ? isCompactDetailViewport : false);
  }, [canShowReferenceImage, isCompactDetailViewport, shoe.id]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [shoe.id]);

  const handleBuyNft = async () => {
    if (!window.ethereum) {
      setBuyMessageTone('error');
      setBuyMessage(
        lang === 'it'
          ? 'MetaMask non è disponibile nel browser.'
          : 'MetaMask is not available in this browser.'
      );
      return;
    }

    if (!DEMETRA_COLLECTION_ADDRESS) {
      setBuyMessageTone('error');
      setBuyMessage(
        lang === 'it'
          ? 'Configura VITE_DEMETRA_COLLECTION_ADDRESS prima di acquistare.'
          : 'Set VITE_DEMETRA_COLLECTION_ADDRESS before buying.'
      );
      return;
    }

    try {
      setBuyBusy(true);
      setBuyMessageTone(null);
      setBuyMessage(lang === 'it' ? 'Invio transazione in corso...' : 'Submitting transaction...');

      let provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      let network = await provider.getNetwork();

      if (network.chainId !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
          });
        } catch (switchError) {
          if (isError(switchError, 'UNKNOWN_ERROR') && switchError.message.includes('4902')) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: SEPOLIA_CHAIN_ID_HEX,
                  chainName: 'Sepolia',
                  nativeCurrency: {
                    name: 'Sepolia Ether',
                    symbol: 'SEP',
                    decimals: 18
                  },
                  rpcUrls: ['https://rpc.sepolia.org'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                }
              ]
            });
          } else {
            throw switchError;
          }
        }

        provider = new BrowserProvider(window.ethereum);
        network = await provider.getNetwork();

        if (network.chainId !== SEPOLIA_CHAIN_ID) {
          setBuyMessageTone('error');
          setBuyMessage(
            lang === 'it'
              ? 'Passa il wallet alla rete Sepolia prima di acquistare.'
              : 'Switch your wallet to the Sepolia network before buying.'
          );
          return;
        }
      }

      const signer = await provider.getSigner();
      const contract = new Contract(DEMETRA_COLLECTION_ADDRESS, DEMETRA_COLLECTION_ABI, signer);
      const tx = await contract.buyNFT(SHOE_TOKEN_IDS[shoe.id], {
        value: parseEther('0.01')
      });

      setBuyMessage(lang === 'it' ? 'Transazione inviata. Attendo conferma...' : 'Transaction sent. Waiting for confirmation...');
      await tx.wait();

      setBuyMessageTone('success');
      setBuyMessage(
        lang === 'it'
          ? `NFT acquistato con successo per ${localizedShoe.price}.`
          : `NFT purchased successfully for ${localizedShoe.price}.`
      );
    } catch (error) {
      console.error('NFT purchase failed', error);

      let message =
        lang === 'it'
          ? 'Acquisto NFT non riuscito.'
          : 'NFT purchase failed.';

      if (isError(error, 'ACTION_REJECTED')) {
        message =
          lang === 'it'
            ? 'Transazione rifiutata nel wallet.'
            : 'Transaction rejected in the wallet.';
      } else if (isError(error, 'CALL_EXCEPTION')) {
        message =
          lang === 'it'
            ? 'L’NFT non è disponibile o il contratto ha rifiutato l’acquisto.'
            : 'The NFT is not available or the contract rejected the purchase.';
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }

      setBuyMessageTone('error');
      setBuyMessage(message);
    } finally {
      setBuyBusy(false);
    }
  };

  return (
    <main className="detail-page">
      <section className="detail-copy">
        <button type="button" className="back-button" onClick={onBack}>
          {lang === 'it' ? 'Torna allo Store' : 'Back to Store'}
        </button>
        <p className="detail-kicker">Demetra NFT / {shoe.serial}</p>
        <h1>{localizedShoe.name}</h1>
        <p className="detail-text">{localizedShoe.description}</p>

        <div className="detail-badges">
          <span>{localizedShoe.rarity}</span>
          <span>{localizedShoe.status}</span>
          <span>{localizedShoe.edition}</span>
        </div>

        <div className="detail-price-card">
          <div>
            <p className="detail-label">{lang === 'it' ? 'Prezzo Mint' : 'Mint Price'}</p>
            <strong>{localizedShoe.price}</strong>
          </div>
          <div>
            <p className="detail-label">{lang === 'it' ? 'Disponibilita' : 'Supply'}</p>
            <strong>{localizedShoe.supply}</strong>
          </div>
        </div>

        <div className="detail-grid">
          <article className="detail-panel">
            <p className="detail-label">{lang === 'it' ? 'Stile' : 'Style'}</p>
            <strong>{localizedShoe.style}</strong>
          </article>
          <article className="detail-panel">
            <p className="detail-label">{lang === 'it' ? 'Materiale' : 'Material'}</p>
            <strong>{localizedShoe.material}</strong>
          </article>
          <article className="detail-panel">
            <p className="detail-label">Palette</p>
            <strong>{localizedShoe.palette}</strong>
          </article>
          <article className="detail-panel">
            <p className="detail-label">{lang === 'it' ? 'Utilita' : 'Utility'}</p>
            <strong>{localizedShoe.utility}</strong>
          </article>
        </div>

        <div className="detail-traits">
          <p className="detail-label">{lang === 'it' ? 'Caratteristiche' : 'Traits'}</p>
          <ul className="detail-specs">
            {localizedShoe.traits.map((trait) => (
              <li key={trait}>{trait}</li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="detail-buy-button"
          onClick={handleBuyNft}
          disabled={buyBusy}
          title={!walletAddress ? (lang === 'it' ? 'Connetti il wallet per acquistare.' : 'Connect your wallet to purchase.') : undefined}
        >
          {buyBusy ? (lang === 'it' ? 'Acquisto in corso...' : 'Buying...') : lang === 'it' ? 'Acquista NFT' : 'Buy NFT'}
        </button>
        {buyMessage ? (
          <p className={buyMessageTone === 'success' ? 'detail-buy-feedback is-success' : 'detail-buy-feedback is-error'}>{buyMessage}</p>
        ) : null}
      </section>

      <section className="detail-viewer">
        <div className="viewer-header">
          <span>{lang === 'it' ? 'Vista 360' : 'Interactive 360'}</span>
          <p>
            {showReferenceImage
              ? lang === 'it'
                ? 'Scheda di riferimento con i quattro lati della sneaker.'
                : 'Reference sheet with the four sides of the sneaker.'
              : lang === 'it'
                ? 'Ruota la sneaker e osserva l’intera silhouette digitale.'
                : 'Rotate the sneaker and inspect the full digital silhouette.'}
          </p>
        </div>
        {canShowReferenceImage ? (
          <button
            type="button"
            className="viewer-toggle-button"
            onClick={() => setShowReferenceImage((current) => !current)}
          >
            {showReferenceImage ? (lang === 'it' ? 'Vedi 3D' : 'View 3D') : lang === 'it' ? 'Vedi Immagine' : 'View Image'}
          </button>
        ) : null}
        {showReferenceImage && canShowReferenceImage ? (
          <div className="viewer-image-wrap">
            <img
              src={referenceImage?.src}
              alt={referenceImage?.alt}
              className="viewer-reference-image"
            />
          </div>
        ) : (
          <Canvas
            key={isCompactDetailViewport ? 'detail-mobile' : 'detail-desktop'}
            camera={
              isCompactDetailViewport
                ? { position: [0, 1.25, 5.1], fov: 34 }
                : { position: [0, 1.2, 4], fov: 30 }
            }
          >
            <color attach="background" args={['#090909']} />
            <ambientLight intensity={1} />
            <directionalLight position={[5, 8, 5]} intensity={2} color="#d7c8ff" />
            <directionalLight position={[-4, 5, 2]} intensity={0.8} color="#4b72ff" />
            <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.22}>
              <group
                position={
                  isCompactDetailViewport
                    ? [shoe.detailPosition[0], shoe.detailPosition[1] + 0.14, shoe.detailPosition[2]]
                    : shoe.detailPosition
                }
                rotation={SHOE_DETAIL_ROTATION}
                scale={isCompactDetailViewport ? shoe.detailScale * 1.18 : shoe.detailScale}
              >
                <ShoeModel modelPath={shoe.modelPath} />
              </group>
            </Float>
            <ContactShadows position={[0, -1.3, 0]} opacity={0.32} scale={8} blur={2.8} far={3} color="#34295c" />
            <OrbitControls
              enablePan={false}
              minDistance={2.5}
              maxDistance={6}
              autoRotate
              autoRotateSpeed={1.2}
            />
            <Preload all />
          </Canvas>
        )}
      </section>
    </main>
  );
}

useGLTF.preload('/room.glb');
useGLTF.preload('/Shoe1.glb');
useGLTF.preload('/Shoe2.glb');
useGLTF.preload('/Shoe3.glb');
useGLTF.preload('/Shoe4.glb');
useGLTF.preload('/Shoe5.glb');
useGLTF.preload('/Shoe6.glb');

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedShoeId, setSelectedShoeId] = useState<ShoeId | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('it');
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletReady, setWalletReady] = useState(false);
  const [ethereumProvider, setEthereumProvider] = useState<EthereumProvider | null>(() =>
    typeof window === 'undefined' ? null : window.ethereum ?? null
  );
  const [providerResolved, setProviderResolved] = useState(() => typeof window === 'undefined');

  const selectedShoe = selectedShoeId ? SHOES.find((shoe) => shoe.id === selectedShoeId) ?? null : null;
  const walletConnected = Boolean(walletAddress);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let cancelled = false;
    let timeoutId = 0;
    let intervalId = 0;

    const resolveProvider = () => {
      const nextProvider = window.ethereum ?? null;

      if (!nextProvider) {
        return false;
      }

      setEthereumProvider(nextProvider);
      setProviderResolved(true);
      return true;
    };

    if (resolveProvider()) {
      return;
    }

    const handleEthereumInitialized = () => {
      if (cancelled) {
        return;
      }

      if (resolveProvider()) {
        window.clearInterval(intervalId);
        window.clearTimeout(timeoutId);
      }
    };

    window.addEventListener('ethereum#initialized', handleEthereumInitialized, { once: true });

    intervalId = window.setInterval(() => {
      if (resolveProvider()) {
        window.clearInterval(intervalId);
        window.clearTimeout(timeoutId);
      }
    }, 250);

    timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      setEthereumProvider(window.ethereum ?? null);
      setProviderResolved(true);
      window.clearInterval(intervalId);
    }, 3200);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      window.removeEventListener('ethereum#initialized', handleEthereumInitialized);
    };
  }, []);

  useEffect(() => {
    const provider = ethereumProvider;

    if (!providerResolved) {
      return;
    }

    if (!provider) {
      setWalletReady(true);
      return;
    }

    const shouldRestore = window.sessionStorage.getItem(WALLET_SESSION_KEY) === '1';

    if (!shouldRestore) {
      setWalletReady(true);
      return;
    }

    let cancelled = false;

    const restoreWalletSession = async () => {
      try {
        const accounts = (await provider.request({ method: 'eth_accounts' })) as string[];

        if (cancelled) {
          return;
        }

        const nextAddress = accounts[0] ?? null;
        setWalletAddress(nextAddress);

        if (!nextAddress) {
          window.sessionStorage.removeItem(WALLET_SESSION_KEY);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Wallet session restore failed', error);
          setWalletAddress(null);
          window.sessionStorage.removeItem(WALLET_SESSION_KEY);
        }
      } finally {
        if (!cancelled) {
          setWalletReady(true);
        }
      }
    };

    void restoreWalletSession();

    return () => {
      cancelled = true;
    };
  }, [ethereumProvider, providerResolved]);

  useEffect(() => {
    if (!walletConnected && currentPage === 'my-nfts') {
      setCurrentPage('home');
    }
  }, [currentPage, walletConnected]);

  useEffect(() => {
    const provider = ethereumProvider;

    if (!provider) {
      return;
    }

    const handleAccountsChanged = (accounts: unknown) => {
      const nextAccounts = Array.isArray(accounts) ? (accounts as string[]) : [];
      const nextAddress = nextAccounts[0] ?? null;
      setWalletAddress(nextAddress);

      if (nextAddress) {
        window.sessionStorage.setItem(WALLET_SESSION_KEY, '1');
      } else {
        window.sessionStorage.removeItem(WALLET_SESSION_KEY);
      }

      setWalletError(null);
    };

    const handleChainChanged = () => {
      setWalletError(null);
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [ethereumProvider]);

  const handleWalletClick = async () => {
    const provider = ethereumProvider ?? window.ethereum ?? null;

    if (walletConnected) {
      try {
        setWalletBusy(true);
        setWalletError(null);
        await provider?.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        });
      } catch (error) {
        console.error('Wallet permission revoke failed, falling back to site disconnect', error);
      } finally {
        setWalletAddress(null);
        setWalletError(null);
        window.sessionStorage.removeItem(WALLET_SESSION_KEY);
        setWalletBusy(false);
      }
      return;
    }

    if (!provider) {
      setWalletError(
        lang === 'it'
          ? 'MetaMask non è installato. Installalo per collegare il wallet.'
          : 'MetaMask is not installed. Install it to connect your wallet.'
      );
      window.open('https://metamask.io/download/', '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      setWalletBusy(true);
      setWalletError(null);
      const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
      const nextAddress = accounts[0] ?? null;

      if (!nextAddress) {
        setWalletAddress(null);
        window.sessionStorage.removeItem(WALLET_SESSION_KEY);
        setWalletError(
          lang === 'it'
            ? 'Nessun account disponibile per la connessione.'
            : 'No account available for connection.'
        );
        return;
      }

      setWalletAddress(nextAddress);
      window.sessionStorage.setItem(WALLET_SESSION_KEY, '1');
    } catch (error) {
      console.error('Wallet connection rejected or failed', error);
      setWalletAddress(null);
      window.sessionStorage.removeItem(WALLET_SESSION_KEY);
      setWalletError(
        lang === 'it'
          ? 'Connessione wallet annullata o non riuscita.'
          : 'Wallet connection was rejected or failed.'
      );
    } finally {
      setWalletBusy(false);
    }
  };

  const handleNavigate = (page: Page) => {
    setSelectedShoeId(null);
    setCurrentPage(page);
  };

  const handleOpenShoe = (shoeId: ShoeId) => {
    setSelectedShoeId(shoeId);
    setCurrentPage('store');
  };

  return (
    <div className="app-shell">
      <AppHeader
        currentPage={currentPage}
        lang={lang}
        walletAddress={walletReady ? walletAddress : null}
        walletBusy={walletBusy || !walletReady}
        walletError={walletError}
        onNavigate={handleNavigate}
        onWalletClick={handleWalletClick}
        onToggleLanguage={() => setLang((current) => (current === 'it' ? 'en' : 'it'))}
      />

      {selectedShoe ? (
        <ShoeDetail lang={lang} shoe={selectedShoe} walletAddress={walletAddress} onBack={() => setSelectedShoeId(null)} />
      ) : currentPage === 'home' ? (
        <HomePage
          lang={lang}
          onEnterStore={() => handleNavigate('store')}
          onOpenAbout={() => handleNavigate('about')}
          onOpenProcess={() => handleNavigate('process')}
        />
      ) : currentPage === 'about' ? (
        <AboutPage lang={lang} />
      ) : currentPage === 'process' ? (
        <ProcessPage lang={lang} onEnterStore={() => handleNavigate('store')} />
      ) : currentPage === 'my-nfts' ? (
        <MyNftPage
          lang={lang}
          walletAddress={walletAddress}
          onOpenShoe={handleOpenShoe}
          onEnterStore={() => handleNavigate('store')}
        />
      ) : (
        <StorePage lang={lang} onSelect={handleOpenShoe} />
      )}
    </div>
  );
}
type SceneGroupProps = Omit<ThreeElements['group'], 'ref'>;
