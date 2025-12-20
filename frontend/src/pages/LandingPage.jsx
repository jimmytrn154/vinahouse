import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

// Icons
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GavelIcon from '@mui/icons-material/Gavel';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SecurityIcon from '@mui/icons-material/Security';
import BoltIcon from '@mui/icons-material/Bolt';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// Placeholder Images for Team
const TEAM_MEMBERS = [
  {
    name: "Nguyen Van Duy Anh",
    role: "Project Manager & QA",
    image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&q=80", 
    desc: "Guardian of the RBAC system."
  },
  {
    name: "Duong Hien Chi Kien",
    role: "Database Architect",
    image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    desc: "Mastermind behind the 3NF schema."
  },
  {
    name: "Tran Anh Chuong",
    role: "Fullstack Developer",
    image: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80",
    desc: "Builder of the API ecosystem."
  },
  {
    name: "VinHousing Admin",
    role: "Security Ops",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    desc: "Ensuring 24/7 platform safety."
  }
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* --- HERO SECTION --- */}
      <header className="landing-hero">
        <div className="hero-bg-glow"></div>
        
        <nav className="landing-nav glass-nav">
          <div className="landing-logo">Vin<span className="text-highlight">Housing</span></div>
          <div className="landing-nav-links">
            <button onClick={() => navigate('/listings')} className="nav-link">Browse</button>
            <button onClick={() => navigate('/login')} className="nav-link">Login</button>
            <button onClick={() => navigate('/register')} className="btn-primary-glow">Get Started</button>
          </div>
        </nav>

        <div className="hero-wrapper">
          <div className="hero-content">
            <div className="status-pill">
              <span className="status-dot"></span> Official University Partner
            </div>
            <h1 className="hero-title">
              Student Housing, <br/>
              <span className="text-gradient">Reimagined.</span>
            </h1>
            <p className="hero-subtitle">
              The first verified marketplace where contracts are digital, landlords are vetted, and your safety is the priority.
            </p>
            
            <div className="hero-cta-group">
              <button className="btn-hero-primary" onClick={() => navigate('/listings')}>
                <SearchIcon /> Find Your Home
              </button>
              <button className="btn-hero-secondary" onClick={() => navigate('/register')}>
                List Property
              </button>
            </div>

            <div className="trust-badges">
              <div className="badge-item"><VerifiedUserIcon fontSize="small"/> Verified Hosts</div>
              <div className="badge-item"><GavelIcon fontSize="small"/> Legal Support</div>
              <div className="badge-item"><BoltIcon fontSize="small"/> Fast Booking</div>
            </div>
          </div>
          
          <div className="hero-image-container">
             <div className="floating-card review-card">
               <div className="avatar-small"></div>
               <div className="review-text">
                 <strong>Safe & Verified</strong>
                 <span>"Finally a place I can trust."</span>
               </div>
             </div>
             <img 
               src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80" 
               alt="Modern Apartment" 
               className="hero-main-img"
             />
          </div>
        </div>
      </header>

      {/* --- BENTO GRID FEATURES --- */}
      <section className="bento-section">
        <div className="section-header">
          <h2>Why VinHousing?</h2>
          <p>We fixed the broken rental market.</p>
        </div>
        
        <div className="bento-grid">
          <div className="bento-card card-large">
            <div className="bento-icon"><VerifiedUserIcon /></div>
            <h3>100% Verified Reviews</h3>
            <p>No fake 5-star bots. Only tenants with a valid digital contract can leave a review. We ensure what you read is real experience.</p>
          </div>

          <div className="bento-card card-medium">
             <div className="bento-icon"><GavelIcon /></div>
             <h3>Smart Contracts</h3>
             <p>Say goodbye to paper scraps. Draft, sign, and store legally binding leases directly on the platform.</p>
          </div>

          <div className="bento-card card-medium">
             <div className="bento-icon"><SupportAgentIcon /></div>
             <h3>Dispute Resolution</h3>
             <p>Admins act as neutral arbiters. We log every report to ensure fair outcomes for students.</p>
          </div>

           <div className="bento-card card-wide">
             <div className="content-row">
               <div className="text-col">
                  <div className="bento-icon"><SecurityIcon /></div>
                  <h3>University Shield</h3>
                  <p>Our "Safe Zone" policy bans bad actors instantly. Your housing safety is backed by institutional oversight.</p>
               </div>
               <div className="visual-col">
                  <div className="dummy-shield"><CheckCircleOutlineIcon sx={{fontSize: 60, color: 'white'}}/></div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- COMPARISON TABLE (RESTORED) --- */}
      <section className="comparison-section">
        <div className="comparison-container">
          <div className="section-header">
            <h2>The Clear Choice</h2>
            <p>Don't settle for chaotic Facebook groups or expensive software.</p>
          </div>
          <div className="table-wrapper pop-out">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Facebook / Zalo</th>
                  <th>Listing Sites</th>
                  <th className="highlight-col-header">VinHousing System</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="feature-row">Search & Filter</td>
                  <td><span className="status-bad">Chaos</span></td>
                  <td>Structured</td>
                  <td className="highlight-col"><span className="status-good">Structured & Verified</span></td>
                </tr>
                <tr>
                  <td className="feature-row">Verification</td>
                  <td>None</td>
                  <td>SMS Only</td>
                  <td className="highlight-col"><span className="status-good">University Approved</span></td>
                </tr>
                <tr>
                  <td className="feature-row">Contracting</td>
                  <td>Paper / Oral</td>
                  <td>Offline</td>
                  <td className="highlight-col"><span className="status-good">100% Digital</span></td>
                </tr>
                <tr>
                  <td className="feature-row">Scam Protection</td>
                  <td><span className="status-bad">High Risk</span></td>
                  <td>Moderate</td>
                  <td className="highlight-col"><span className="status-good">Admin Governance</span></td>
                </tr>
                <tr>
                  <td className="feature-row">Reviews</td>
                  <td>Unverified</td>
                  <td>Open / Fakeable</td>
                  <td className="highlight-col"><span className="status-good">Contract-Linked Only</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* --- CONTINUOUS TEAM SCROLL --- */}
      <section className="team-section">
        <div className="section-header">
          <h2>Built by Students, For Students</h2>
          <p>Meet the engineering team behind the platform.</p>
        </div>
        
        <div className="marquee-container">
          <div className="marquee-track">
            {[...TEAM_MEMBERS, ...TEAM_MEMBERS, ...TEAM_MEMBERS].map((member, index) => (
              <div className="team-card-modern" key={index}>
                <div className="img-wrapper">
                  <img src={member.image} alt={member.name} />
                </div>
                <div className="team-info">
                  <h3>{member.name}</h3>
                  <span className="role-tag">{member.role}</span>
                  <p>{member.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA FOOTER --- */}
      <footer className="modern-footer">
        <div className="footer-bg-blur"></div>
        <div className="footer-inner">
           <h2>Start Your Semester Right</h2>
           <p>Join thousands of students secure their next home.</p>
           <button className="btn-glow-large" onClick={() => navigate('/register')}>
             Create Free Account <ArrowForwardIcon />
           </button>
           <div className="copyright">
             &copy; 2025 VinHousing Project. All rights reserved.
           </div>
        </div>
      </footer>
    </div>
  );
}