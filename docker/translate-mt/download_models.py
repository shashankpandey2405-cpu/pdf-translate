"""Pre-install Argos language packages for production pairs."""
import argostranslate.package
import argostranslate.translate

# (from_code, to_code) — priority pairs for PDFTrusted Classic MT
PAIRS = [
    ("en", "hi"),
    ("hi", "en"),
    ("en", "ar"),
    ("ar", "en"),
    ("en", "ur"),
    ("ur", "en"),
    ("en", "bn"),
    ("bn", "en"),
    ("en", "fr"),
    ("fr", "en"),
    ("en", "de"),
    ("de", "en"),
    ("en", "es"),
    ("es", "en"),
    ("en", "it"),
    ("it", "en"),
    ("en", "pt"),
    ("pt", "en"),
    ("en", "ru"),
    ("ru", "en"),
    ("en", "tr"),
    ("tr", "en"),
]


def main() -> None:
    argostranslate.package.update_package_index()
    available = argostranslate.package.get_available_packages()
    installed = 0
    for from_code, to_code in PAIRS:
        pkg = next(
            (p for p in available if p.from_code == from_code and p.to_code == to_code),
            None,
        )
        if not pkg:
            print(f"[translate-mt] skip missing pair {from_code}->{to_code}")
            continue
        path = pkg.download()
        argostranslate.package.install_from_path(path)
        installed += 1
        print(f"[translate-mt] installed {from_code}->{to_code}")
    print(f"[translate-mt] done, {installed} packages")


if __name__ == "__main__":
    main()
