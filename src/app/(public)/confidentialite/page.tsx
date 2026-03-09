import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — CarrièrePilot',
  description:
    'Comment CarrièrePilot collecte, utilise et protège vos données personnelles. Conformité RGPD.',
};

export default function ConfidentialitePage() {
  return (
    <section className="section-padding">
      <div className="container-app max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="font-heading text-4xl font-extrabold text-[#1E293B] mb-2">
            Politique de Confidentialité
          </h1>
          <p className="text-sm text-[#94A3B8]">Dernière mise à jour : 15 janvier 2025</p>
        </div>

        <div className="space-y-8 text-[#374151]">

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">1. Responsable du traitement</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              CarrièrePilot est le responsable du traitement de vos données personnelles au sens du
              Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">2. Données collectées</h2>
            <p className="text-sm leading-relaxed text-[#64748B] mb-3">
              Lors de l&apos;utilisation du service, nous collectons les catégories de données suivantes&nbsp;:
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'Données d\'compte',
                  items: ['Adresse email', 'Nom et prénom', 'Mot de passe (chiffré)', 'Date de création du compte'],
                },
                {
                  title: 'Données de profil professionnel',
                  items: ['Expériences professionnelles', 'Formation et diplômes', 'Compétences', 'Informations de CV', 'Lettres de motivation générées'],
                },
                {
                  title: 'Données d\'utilisation',
                  items: ['Candidatures suivies', 'Offres consultées', 'Quotas d\'utilisation', 'Journaux de connexion (adresse IP, horodatage)'],
                },
                {
                  title: 'Données de paiement',
                  items: ['Plan d\'abonnement souscrit', 'Historique des transactions (via Stripe — les données de carte ne nous parviennent pas)'],
                },
              ].map(({ title, items }) => (
                <div key={title} className="bg-[#F7F8FC] border border-[#E2E8F0] rounded-xl p-4">
                  <p className="font-semibold text-sm text-[#1E293B] mb-2">{title}</p>
                  <ul className="space-y-1 text-xs text-[#64748B] list-disc list-inside">
                    {items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">3. Finalités du traitement</h2>
            <p className="text-sm leading-relaxed text-[#64748B] mb-2">
              Vos données sont utilisées pour&nbsp;:
            </p>
            <ul className="space-y-1 text-sm text-[#64748B] list-disc list-inside">
              <li>Fournir et améliorer les fonctionnalités du service</li>
              <li>Personnaliser les contenus générés par l&apos;IA (CV, lettres de motivation)</li>
              <li>Gérer votre compte et votre abonnement</li>
              <li>Envoyer des notifications liées à votre activité (alertes emploi, confirmations)</li>
              <li>Assurer la sécurité du service et prévenir les abus</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">4. Base légale</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              Le traitement de vos données repose sur votre <strong>consentement</strong> (lors de
              la création de compte), sur l&apos;<strong>exécution du contrat</strong> (fourniture du
              service souscrit) et sur notre <strong>intérêt légitime</strong> (amélioration du service,
              sécurité, prévention de la fraude).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">5. Durée de conservation</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              Vos données sont conservées pendant toute la durée de votre utilisation du service,
              puis pendant <strong>30 jours</strong> après la suppression de votre compte (pour permettre
              une éventuelle réactivation), avant suppression définitive. Les données de facturation
              sont conservées 5 ans conformément aux obligations légales.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">6. Partage des données</h2>
            <p className="text-sm leading-relaxed text-[#64748B] mb-2">
              Vos données ne sont jamais vendues à des tiers. Elles peuvent être partagées avec&nbsp;:
            </p>
            <ul className="space-y-1 text-sm text-[#64748B] list-disc list-inside">
              <li><strong>Neon</strong> (hébergement base de données — USA, conformité RGPD via clauses contractuelles types)</li>
              <li><strong>Vercel</strong> (hébergement applicatif — USA, conformité RGPD)</li>
              <li><strong>OpenAI / Anthropic</strong> (génération IA — les prompts peuvent contenir des données de profil)</li>
              <li><strong>Stripe</strong> (paiement — traitement sécurisé des transactions)</li>
              <li><strong>France Travail API</strong> (recherche d&apos;offres — données de recherche uniquement)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">7. Vos droits</h2>
            <p className="text-sm leading-relaxed text-[#64748B] mb-2">
              Conformément au RGPD, vous disposez des droits suivants&nbsp;:
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { right: 'Droit d\'accès', desc: 'Obtenir une copie de vos données' },
                { right: 'Droit de rectification', desc: 'Corriger des données inexactes' },
                { right: 'Droit à l\'effacement', desc: 'Supprimer votre compte et vos données' },
                { right: 'Droit à la portabilité', desc: 'Exporter vos données dans un format lisible' },
                { right: 'Droit d\'opposition', desc: 'Vous opposer à certains traitements' },
                { right: 'Droit à la limitation', desc: 'Limiter le traitement de vos données' },
              ].map(({ right, desc }) => (
                <div key={right} className="bg-[#F7F8FC] border border-[#E2E8F0] rounded-xl p-3">
                  <p className="font-semibold text-xs text-[#1E293B]">{right}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-[#64748B] mt-3">
              Pour exercer ces droits, contactez-nous via votre tableau de bord ou écrivez à la CNIL
              si vous estimez que vos droits ne sont pas respectés.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">8. Cookies</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              CarrièrePilot utilise uniquement des cookies strictement nécessaires au fonctionnement
              du service (session d&apos;authentification). Aucun cookie de tracking ou publicitaire
              n&apos;est déposé.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">9. Sécurité</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
              protéger vos données&nbsp;: connexions chiffrées (HTTPS/TLS), mots de passe hachés (bcrypt),
              accès à la base de données restreints, journalisation des accès.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">10. Modifications</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              Nous pouvons modifier la présente politique à tout moment. Toute modification
              significative sera notifiée par email ou par une bannière visible sur l&apos;application.
              La date de dernière mise à jour figure en haut de cette page.
            </p>
          </section>

        </div>
      </div>
    </section>
  );
}
