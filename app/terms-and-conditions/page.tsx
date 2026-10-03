
import Header from '@/components/layout/Header';
import AnimatedSection from '@/components/ui/AnimatedSection';
import styles from './page.module.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | SpeakEasy',
  description:
    'Terms and Conditions governing the use of SpeakEasy, an AI-powered voice communication and interview practice platform.',
};

export default function TermsPage() {
  return (
    <>
      <Header />

      <main className={styles.main}>
        <AnimatedSection className={styles.hero}>
          <h1 className={styles.subtitle}>Terms &amp; Conditions</h1>
          <p className={styles.subtitle}>Last Updated: October 2026</p>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>1. Introduction</h2>

          <p>
            Welcome to SpeakEasy, an AI-powered communication and interview
            practice platform designed to help users improve their English
            communication, interview skills, presentation abilities, debating
            skills, and confidence while speaking.
          </p>

          <p>
            These Terms &amp; Conditions govern your access to and use of the
            SpeakEasy website and its available features. By accessing or
            using SpeakEasy, you acknowledge that you have read, understood,
            and agreed to these Terms &amp; Conditions.
          </p>

          <p>
            These Terms should be read together with our Privacy Policy, which
            explains how information submitted during your use of SpeakEasy is
            processed and handled.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>2. About the Service</h2>

          <p>
            SpeakEasy provides an interactive environment for practicing
            communication through AI-assisted conversations, interviews,
            presentations, debates, and other speaking activities.
          </p>

          <p>Depending on the available functionality, SpeakEasy may provide:</p>

          <ul>
            <li>
              <strong>Interview Mode:</strong> Practice interviews based on
              selected or custom topics.
            </li>

            <li>
              <strong>Pressure Mode:</strong> Receive a topic, prepare within a
              limited period, and present your response under time pressure.
            </li>

            <li>
              <strong>Opposite/Debate Mode:</strong> Present an argument either
              in support of or against a specified topic.
            </li>

            <li>
              <strong>Document Mode:</strong> Upload a presentation or document
              and use it as context for an AI-based interview or presentation
              session.
            </li>

            <li>
              <strong>AI Analysis:</strong> Receive feedback relating to
              communication, structure, clarity, filler words, and other
              aspects of a session.
            </li>

            <li>
              <strong>Performance Reports:</strong> Receive AI-generated
              summaries and recommendations for improving communication.
            </li>

            <li>
              <strong>PDF Reports:</strong> Where available, generate or
              download a report containing the results of a session.
            </li>
          </ul>

          <p>
            Features may change, improve, or be temporarily unavailable as the
            platform develops.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>3. Educational and Practice Purpose</h2>

          <p>
            SpeakEasy is primarily designed as an educational and communication
            practice tool. Its purpose is to provide users with an opportunity
            to practice speaking and receive automated feedback.
          </p>

          <p>
            AI-generated scores, recommendations, observations, and reports
            should not be considered professional certifications, official
            examination results, employment assessments, or guaranteed
            representations of a user&apos;s actual abilities.
          </p>

          <p>
            Artificial intelligence may misunderstand context, pronunciation,
            wording, arguments, or the intended meaning of a response. Users
            should therefore treat the feedback provided by SpeakEasy as
            guidance for practice and improvement rather than as an absolute
            evaluation.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={`${styles.section} ${styles.grokSection}`}>
          <div className={styles.grokBadge}>AI SERVICE PROVIDER</div>

          <h2>4. Grok API and AI Processing</h2>

          <p>
            SpeakEasy currently uses the{' '}
            <strong className={styles.grokHighlight}>
              Grok API provided by xAI
            </strong>{' '}
            to support certain AI-powered features of the platform.
          </p>

          <p>
            When you request AI-powered functionality, information necessary
            to provide that functionality may be transmitted through the Grok
            API. Depending on the feature being used, this may include text
            transcripts, interview responses, presentation material, extracted
            document content, or other information required to generate the
            requested response.
          </p>

          <div className={styles.grokNotice}>
            <strong>SpeakEasy does not use your submitted content to train its
              own AI models.</strong>

            <span>
              AI processing is performed using the services required by the
              platform. The handling of information transmitted to third-party
              AI providers is subject to the applicable policies and practices
              of those providers.
            </span>
          </div>

          <p>
            According to xAI&apos;s current API security documentation, API
            inputs and outputs are not used for model training without explicit
            permission. xAI also states that API requests and responses may be
            temporarily retained for up to 30 days for abuse and misuse
            auditing under its standard API configuration.
          </p>

          <p>
            Users should therefore avoid submitting passwords, financial
            information, government identification numbers, confidential
            business information, or other highly sensitive information unless
            such information is genuinely necessary for the requested
            functionality.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>5. User Content</h2>

          <p>
            SpeakEasy may allow users to submit text, interview responses,
            presentations, documents, or other material for the purpose of
            receiving AI-generated analysis.
          </p>

          <p>
            Users retain ownership of content that they independently own.
            Submitting content to SpeakEasy does not, by itself, transfer
            ownership of that content to SpeakEasy.
          </p>

          <p>
            By submitting content, you confirm that you have the necessary
            rights or authorization to use that content and that your
            submission does not knowingly violate applicable laws or the rights
            of another person.
          </p>

          <p>
            You should not upload confidential, private, copyrighted, or
            sensitive information belonging to another person or organization
            without appropriate authorization.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>6. Session-Based Processing and Data Storage</h2>

          <p>
            SpeakEasy is designed around a session-based processing model. At
            the current stage of the platform, SpeakEasy does not maintain a
            dedicated persistent database for storing users&apos; interview
            responses, uploaded documents, voice transcripts, or session
            reports.
          </p>

          <p>
            This means that SpeakEasy does not provide a permanent user-content
            history or profile containing previous sessions.
          </p>

          <p>
            However, information transmitted to third-party services required
            to provide AI functionality may be subject to the retention
            practices of those services. Users should review the Privacy
            Policy for additional information about how such processing works.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>7. User Responsibilities</h2>

          <p>
            Users are expected to use SpeakEasy responsibly and only for lawful
            purposes. By using the platform, you agree not to misuse the
            website, its infrastructure, APIs, or AI functionality.
          </p>

          <p>Users must not:</p>

          <ul>
            <li>
              Attempt to gain unauthorized access to the website, servers, APIs,
              or infrastructure.
            </li>

            <li>
              Attempt to bypass authentication, security controls, usage
              restrictions, or technical safeguards.
            </li>

            <li>
              Upload malware, malicious files, or content intended to damage or
              disrupt the service.
            </li>

            <li>
              Use the platform for fraudulent, unlawful, or abusive activities.
            </li>

            <li>
              Attempt to obtain or expose another user&apos;s information.
            </li>

            <li>
              Upload another person&apos;s private information without
              appropriate authorization.
            </li>

            <li>
              Intentionally overload, disrupt, or interfere with the operation
              of the service or its APIs.
            </li>

            <li>
              Attempt to circumvent technical limitations or security
              mechanisms.
            </li>
          </ul>

          <p>
            We reserve the right to restrict access where reasonably necessary
            to protect the platform, its users, or third-party services.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>8. AI-Generated Reports and Scores</h2>

          <p>
            SpeakEasy may generate scores, filler-word analysis, communication
            observations, recommendations, summaries, and other performance
            indicators using automated AI systems.
          </p>

          <p>
            These results are estimates generated by artificial intelligence
            and may not always accurately represent a user&apos;s performance.
            The system may incorrectly interpret an answer, misunderstand an
            argument, identify a filler word incorrectly, or assign an
            inaccurate score.
          </p>

          <p>
            Users should therefore not rely exclusively on an AI-generated
            report when making important academic, employment, professional, or
            personal decisions.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>9. Intellectual Property</h2>

          <p>
            The SpeakEasy name, logo, website design, interface, original
            platform content, software, visual elements, and other materials
            created for SpeakEasy are protected by applicable intellectual
            property laws and remain the property of their respective owners,
            unless otherwise stated.
          </p>

          <p>
            Users retain ownership of content they independently own and
            submit to the platform. Nothing in these Terms transfers ownership
            of such content to SpeakEasy merely because it is submitted for
            analysis.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>10. Third-Party Services</h2>

          <p>
            Certain SpeakEasy features depend on third-party services,
            including AI APIs, hosting infrastructure, document-processing
            services, or other technical providers.
          </p>

          <p>
            These services operate independently from SpeakEasy and may have
            their own terms, privacy policies, security practices, and service
            limitations.
          </p>

          <p>
            SpeakEasy does not control the independent operation of third-party
            services and cannot guarantee their uninterrupted availability.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>11. Security</h2>

          <p>
            SpeakEasy takes reasonable steps to operate the platform
            responsibly and reduce unnecessary exposure of user information.
            The platform is designed without a persistent database for storing
            user session content at the current stage of development.
          </p>

          <p>
            However, no internet-based service, network transmission, or
            third-party infrastructure can be guaranteed to be completely
            secure. Users should therefore avoid submitting information that
            they would not want transmitted to the services required to
            provide the requested functionality.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>12. Service Availability</h2>

          <p>
            SpeakEasy is provided on an &quot;as available&quot; basis. The
            service may occasionally become unavailable due to maintenance,
            hosting issues, network problems, third-party API outages, or other
            circumstances outside our reasonable control.
          </p>

          <p>
            We may also modify, temporarily disable, replace, or discontinue
            individual features as the platform develops.
          </p>

          <p>
            We do not guarantee uninterrupted availability or that every
            feature will remain available indefinitely.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>13. Disclaimer</h2>

          <p>
            SpeakEasy is provided primarily as an educational and communication
            practice platform. We do not guarantee that using SpeakEasy will
            result in improved English proficiency, successful interviews,
            employment, higher examination scores, professional certification,
            or any particular personal or professional outcome.
          </p>

          <p>
            Results depend on many factors outside the control of the platform,
            including the user&apos;s preparation, experience, practice,
            communication ability, and individual circumstances.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>14. Limitation of Liability</h2>

          <p>
            To the extent permitted by applicable law, SpeakEasy and its
            developers shall not be responsible for losses arising solely from
            reliance on AI-generated feedback, temporary service
            interruptions, third-party service failures, or inaccurate
            AI-generated analysis.
          </p>

          <p>
            Nothing in these Terms is intended to exclude or limit any
            liability that cannot legally be excluded or limited under
            applicable law.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>15. Changes to the Platform</h2>

          <p>
            SpeakEasy may introduce new features, modify existing
            functionality, improve its AI systems, or make other changes to the
            platform over time.
          </p>

          <p>
            Such changes may affect the features, interface, availability, or
            operation of the service. Where appropriate, related changes may
            also require updates to these Terms or our Privacy Policy.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>16. Changes to These Terms</h2>

          <p>
            We may update these Terms &amp; Conditions from time to time to
            reflect changes to the platform, technology, applicable
            requirements, or our practices.
          </p>

          <p>
            Updated versions will be published on this page together with a
            revised &quot;Last Updated&quot; date. Users are encouraged to
            review these Terms periodically.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>17. Privacy Policy</h2>

          <p>
            Our Privacy Policy forms an important part of these Terms and
            explains how information submitted through SpeakEasy is processed
            and handled.
          </p>

          <p>
            By using features that involve submitting information, you
            acknowledge that you have had an opportunity to review the Privacy
            Policy.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>18. Governing Law</h2>

          <p>
            These Terms shall be interpreted in accordance with applicable laws
            of India, subject to any mandatory legal rights or protections that
            may apply to the user.
          </p>

          <p>
            Any dispute relating to the use of SpeakEasy shall be handled in
            accordance with applicable law and the appropriate legal
            jurisdiction.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>19. Contact</h2>

          <p>
            If you have questions or concerns regarding these Terms, the
            Privacy Policy, data handling, AI processing, or the operation of
            SpeakEasy, you may contact the project team through the contact
            information provided on the website.
          </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.section}>
          <h2>20. Acceptance of Terms</h2>

          <p>
            By accessing or using SpeakEasy, you acknowledge that you have had
            an opportunity to read and understand these Terms &amp; Conditions
            and agree to use the platform responsibly and in accordance with
            applicable laws.
          </p>

          <p>
            If you do not agree with these Terms, you should discontinue use of
            the platform.
          </p>
          </section>
        </AnimatedSection>
      </main>
    </>
  );
}
