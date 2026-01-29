import React from "react";

const socialLinks = [
  { href: "#", icon: "facebook" },
  { href: "#", icon: "twitter" },
  { href: "#", icon: "linkedin" },
  { href: "#", icon: "instagram" },
];

const serviceLinks = [
  { label: "Accounts", path: "/accounts" },
  { label: "Transfers", path: "/transfer" },
  { label: "Deposits", path: "/deposit" },
  { label: "Withdrawals", path: "/withdraw" },
  { label: "Reports", path: "/summary" },
];

const supportLinks = [
  { label: "Help Center", path: "/help" },
  { label: "Contact Us", path: "/contact" },
  { label: "Security", path: "/security" },
  { label: "FAQs", path: "/faq" },
  { label: "Live Chat", path: "/chat" },  // Added live chat with /chat path
];

const legalLinks = ["Privacy Policy", "Terms of Use", "Compliance", "Disclosures"];

const contactInfo = [
  { icon: "geo-alt-fill", text: "123 Finance St, Banking City" },
  { icon: "telephone-fill", text: "1-800-MYBANK" },
  { icon: "envelope-fill", text: "support@mybank.com" },
];

export const Footer: React.FC = React.memo(() => {
  const currentYear = new Date().getFullYear();

  const renderLinks = (links: string[] | { label: string; path: string }[], isInternal = false) =>
    (links as any[]).map((link, i) => (
      <li key={i} className="mb-2">
        <a 
          href={isInternal ? link.path : "#"} 
          className="footer-link"
        >
          {isInternal ? link.label : link}
          {isInternal && link.label === "Live Chat" && (
            <i className="bi bi-chat-dots-fill ms-2"></i>
          )}
        </a>
      </li>
    ));

  return (
    <footer className="footer mybg pt-5 pb-4">
      <div className="footer-container">
        <div className="row g-4">

          {/* Branding */}
          <div className="col-lg-4 mb-4">
            <div className="footer-brand d-flex align-items-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
                <path fill="currentColor" d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2z" />
                <path fill="currentColor" d="M11 12.5L3 9v10h2v-5h4v5h2v-7.5zM17 15h2v4h-2v-4z" />
              </svg>
              <span className="brand-text fs-5 fw-bold ms-2">MyBank</span>
            </div>
            <p className="footer-text text-white-50 mb-3">
              Your trusted financial partner for secure and innovative banking solutions.
            </p>
            <div className="social-links">
              {socialLinks.map(({ href, icon }) => (
                <a key={icon} href={href} className="social-icon me-2">
                  <i className={`bi bi-${icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="col-lg-2 col-md-4 mb-4">
            <h5 className="footer-heading mb-3">Services</h5>
            <ul className="footer-links list-unstyled">
              {renderLinks(serviceLinks, true)}
            </ul>
          </div>

          {/* Support */}
          <div className="col-lg-2 col-md-4 mb-4">
            <h5 className="footer-heading mb-3">Support</h5>
            <ul className="footer-links list-unstyled">
              {renderLinks(supportLinks, true)}
            </ul>
          </div>

          {/* Legal */}
          <div className="col-lg-2 col-md-4 mb-4">
            <h5 className="footer-heading mb-3">Legal</h5>
            <ul className="footer-links list-unstyled">
              {renderLinks(legalLinks)}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-lg-2 mb-4">
            <h5 className="footer-heading mb-3">Contact</h5>
            <ul className="footer-contacts list-unstyled">
              {contactInfo.map(({ icon, text }, idx) => (
                <li key={idx} className="mb-2 d-flex align-items-start">
                  <i className={`bi bi-${icon} me-2 mt-1`}></i>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center pt-3 mt-3 border-top border-secondary">
          <p className="small text-white-50 mb-0">
            © {currentYear} MyBank. All rights reserved.
            <span className="d-block d-sm-inline-block mt-1 mt-sm-0">
              {" "}Member FDIC. Equal Housing Lender.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
});
