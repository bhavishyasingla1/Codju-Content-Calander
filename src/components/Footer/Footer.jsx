import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        <p className="footer__text">
          &copy; {new Date().getFullYear()} Codju Marketing Hub. Built for creators.
        </p>
        <div className="footer__mascot-container">
          <img
            src="/assets/codju-mascot.png"
            alt="Mascot Helper"
            className="footer__mascot"
            title="Hi! Let's get creative today! 🚀"
          />
          <div className="footer__bubble">Ready to create? ✨</div>
        </div>
      </div>
    </footer>
  );
}
