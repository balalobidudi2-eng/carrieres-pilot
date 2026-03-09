import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — CarrièrePilot",
  description:
    "Conditions générales d'utilisation du service CarrièrePilot. Dernière mise à jour : janvier 2025.",
};

export default function CGUPage() {
  return (
    <section className="section-padding">
      <div className="container-app max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="font-heading text-4xl font-extrabold text-[#1E293B] mb-2">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="text-sm text-[#94A3B8]">Dernière mise à jour : 15 janvier 2025</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-[#374151]">

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">1. Objet</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et
              l&apos;utilisation du service CarrièrePilot, accessible à l&apos;adresse
              carrieres-pilot.vercel.app, édité par l&apos;éditeur du service (ci-après «&nbsp;nous&nbsp;»).
              En créant un compte ou en utilisant le service, vous acceptez sans réserve les présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">2. Description du service</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              CarrièrePilot est une plateforme SaaS d&apos;aide à la recherche d&apos;emploi utilisant
              l&apos;intelligence artificielle. Elle permet notamment&nbsp;:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#64748B] list-disc list-inside">
              <li>La génération de CV personnalisés</li>
              <li>La rédaction de lettres de motivation adaptées à chaque offre</li>
              <li>Le suivi des candidatures (tableau Kanban)</li>
              <li>La recherche automatisée d&apos;offres d&apos;emploi</li>
              <li>La simulation de questions d&apos;entretien</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">3. Accès au service</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              L&apos;accès au service nécessite la création d&apos;un compte avec une adresse email valide.
              Vous êtes responsable de la confidentialité de vos identifiants de connexion. Toute utilisation
              du service via votre compte est réputée effectuée par vous.
            </p>
            <p className="text-sm leading-relaxed text-[#64748B] mt-2">
              Le service est accessible 24h/24, 7j/7, sous réserve des opérations de maintenance.
              Nous nous réservons le droit de suspendre ou d&apos;interrompre l&apos;accès au service à tout
              moment, notamment en cas d&apos;utilisation abusive.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">4. Plans et facturation</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              CarrièrePilot propose plusieurs plans tarifaires (Free, Pro, Expert). Les quotas d&apos;utilisation
              associés à chaque plan sont détaillés sur la page Tarifs. Les abonnements payants sont
              facturés mensuellement via notre prestataire de paiement sécurisé Stripe.
            </p>
            <p className="text-sm leading-relaxed text-[#64748B] mt-2">
              Les quotas sont réinitialisés chaque jour à minuit (UTC+1). Aucun report de quota non utilisé
              n&apos;est effectué d&apos;un mois sur l&apos;autre.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">5. Propriété intellectuelle</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              L&apos;ensemble des éléments constituant le service (interface, code, logos, textes, etc.)
              est la propriété exclusive de l&apos;éditeur. Les contenus générés par l&apos;IA à votre demande
              (CV, lettres de motivation) vous appartiennent dès leur création.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">6. Responsabilités</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              CarrièrePilot met à disposition des outils d&apos;aide à la candidature. Les contenus générés
              par l&apos;IA sont fournis à titre indicatif et doivent être relus et vérifiés par l&apos;utilisateur
              avant toute utilisation. L&apos;éditeur ne peut être tenu responsable des décisions de recrutement
              prises par des tiers.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">7. Données personnelles</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              Le traitement de vos données personnelles est décrit dans notre{' '}
              <a href="/confidentialite" className="text-accent hover:underline font-medium">
                Politique de Confidentialité
              </a>
              . En utilisant le service, vous acceptez ce traitement.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">8. Résiliation</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre profil.
              La résiliation prend effet immédiatement. Les données associées à votre compte seront
              supprimées conformément à notre politique de rétention (30 jours).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">9. Droit applicable</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              Les présentes CGU sont soumises au droit français. Tout litige relatif à leur
              interprétation ou exécution sera de la compétence exclusive des tribunaux français.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-3">10. Contact</h2>
            <p className="text-sm leading-relaxed text-[#64748B]">
              Pour toute question relative aux présentes CGU, vous pouvez nous contacter par email à
              l&apos;adresse indiquée sur le tableau de bord de votre compte.
            </p>
          </section>

        </div>
      </div>
    </section>
  );
}
