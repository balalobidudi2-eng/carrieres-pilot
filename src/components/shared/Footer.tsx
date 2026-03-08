import Link from 'next/link';
import { Zap, Twitter, Linkedin, Github } from 'lucide-react';

const footerLinks = {
  Produit: [
    { label: 'Fonctionnalités', href: '/fonctionnalites' },
    { label: 'Tarifs', href: '/tarifs' },
    { label: 'Blog', href: '/blog' },
  ],
  Légal: [
    { label: 'Conditions générales', href: '/cgu' },
    { label: 'Confidentialité', href: '/confidentialite' },
  ],
  Compte: [
    { label: 'Se connecter', href: '/connexion' },
    { label: "S'inscrire", href: '/inscription' },
    { label: 'Tableau de bord', href: '/dashboard' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#0D1B2A] text-white">
      <div className="container-app py-14">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-heading font-bold text-white text-lg">
              <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              CarrièrePilot
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              La plateforme SaaS de recherche d&apos;emploi propulsée par l&apos;IA générative.
            </p>
            <div className="flex items-center gap-3">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  aria-label="Social link"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-sm font-semibold text-white mb-4">{group}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} CarrièrePilot. Tous droits réservés.
          </p>
          <p className="text-xs text-white/30">
            Fait avec ❤️ pour les chercheurs d&apos;emploi français
          </p>
        </div>
      </div>
    </footer>
  );
}
