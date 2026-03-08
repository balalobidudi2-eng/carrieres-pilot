'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const navLinks = [
  { label: 'Fonctionnalités', href: '/fonctionnalites' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Blog', href: '/blog' },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-lg border-b border-[#E2E8F0]" />
      <div className="relative container-app h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-heading font-bold text-[#1E293B] text-lg">
          <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          CarrièrePilot
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#64748B] hover:text-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/connexion">
            <Button variant="ghost" size="sm">Se connecter</Button>
          </Link>
          <Link href="/inscription">
            <Button size="sm">Commencer gratuitement</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-[#64748B] hover:bg-gray-100"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-16 inset-x-0 bg-white border-b border-[#E2E8F0] shadow-lg overflow-hidden"
          >
            <div className="container-app py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-[#1E293B] hover:bg-[#F7F8FC] transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-[#E2E8F0] flex flex-col gap-2">
                <Link href="/connexion" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" fullWidth>Se connecter</Button>
                </Link>
                <Link href="/inscription" onClick={() => setMenuOpen(false)}>
                  <Button fullWidth>Commencer gratuitement</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
