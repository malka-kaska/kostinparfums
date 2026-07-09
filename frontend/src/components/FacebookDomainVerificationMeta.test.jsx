import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import FacebookDomainVerificationMeta from "./FacebookDomainVerificationMeta";

const META_SELECTOR = 'meta[name="facebook-domain-verification"]';

describe("FacebookDomainVerificationMeta", () => {
  const originalVerificationCode = process.env.REACT_APP_FB_DOMAIN_VERIFICATION;
  let container;
  let root;

  beforeAll(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    document.head.querySelector(META_SELECTOR)?.remove();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    document.head.querySelector(META_SELECTOR)?.remove();

    if (originalVerificationCode === undefined) {
      delete process.env.REACT_APP_FB_DOMAIN_VERIFICATION;
    } else {
      process.env.REACT_APP_FB_DOMAIN_VERIFICATION = originalVerificationCode;
    }
  });

  it("adds the verification meta tag when the env variable is set", () => {
    process.env.REACT_APP_FB_DOMAIN_VERIFICATION = "verify-token-123";

    act(() => {
      root.render(<FacebookDomainVerificationMeta />);
    });

    const metaTag = document.head.querySelector(META_SELECTOR);

    expect(metaTag).not.toBeNull();
    expect(metaTag.getAttribute("content")).toBe("verify-token-123");
  });

  it("does not add the verification meta tag when the env variable is missing", () => {
    delete process.env.REACT_APP_FB_DOMAIN_VERIFICATION;

    act(() => {
      root.render(<FacebookDomainVerificationMeta />);
    });

    expect(document.head.querySelector(META_SELECTOR)).toBeNull();
  });
});
