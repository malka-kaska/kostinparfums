import { useEffect } from "react";

const META_NAME = "facebook-domain-verification";

function FacebookDomainVerificationMeta() {
  useEffect(() => {
    const verificationCode = process.env.REACT_APP_FB_DOMAIN_VERIFICATION?.trim();

    if (!verificationCode) {
      return undefined;
    }

    const existingMeta = document.head.querySelector(`meta[name="${META_NAME}"]`);
    const metaElement = existingMeta || document.createElement("meta");

    metaElement.setAttribute("name", META_NAME);
    metaElement.setAttribute("content", verificationCode);

    if (!existingMeta) {
      document.head.appendChild(metaElement);
    }

    return () => {
      if (metaElement.parentNode) {
        metaElement.parentNode.removeChild(metaElement);
      }
    };
  }, []);

  return null;
}

export default FacebookDomainVerificationMeta;
