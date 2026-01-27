#!/usr/bin/env python3
"""
Astro Lint Setup & Runner

Astroプロジェクトを自動検出し、型チェック（astro check）を実行する。
@astrojs/check がインストールされていなければ自動でインストールする。
"""

import subprocess
import sys
from pathlib import Path


def find_astro_projects(root: Path) -> list[Path]:
    """
    astro.config.* を探してAstroプロジェクトのルートを検出する。
    ドットで始まるディレクトリ、node_modules内は除外。
    """
    projects = []
    for config_file in root.rglob("astro.config.*"):
        # ドットで始まるディレクトリは除外（.claude, .git, .venv等）
        if any(part.startswith(".") for part in config_file.relative_to(root).parts):
            continue
        # node_modules内は除外
        if "node_modules" in config_file.parts:
            continue
        projects.append(config_file.parent)
    return sorted(set(projects))


def check_astro_check_installed(project_path: Path) -> bool:
    """
    @astrojs/check がインストールされているか確認する。
    """
    result = subprocess.run(
        ["npm", "ls", "@astrojs/check"],
        cwd=project_path,
        capture_output=True,
        text=True,
    )
    return result.returncode == 0


def install_astro_check(project_path: Path) -> bool:
    """
    @astrojs/check をインストールする。
    """
    print(f"  Installing @astrojs/check in {project_path.name}...")
    result = subprocess.run(
        ["npm", "install", "-D", "@astrojs/check"],
        cwd=project_path,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"  Error: {result.stderr}")
        return False
    print(f"  Installed successfully.")
    return True


def run_astro_check(project_path: Path) -> tuple[int, str]:
    """
    npx astro check を実行し、結果を返す。
    戻り値: (エラー数, 出力テキスト)
    """
    result = subprocess.run(
        ["npx", "astro", "check"],
        cwd=project_path,
        capture_output=True,
        text=True,
    )

    output = result.stdout + result.stderr

    # エラー数を抽出（"- X errors" のパターン）
    error_count = 0
    for line in output.split("\n"):
        if "errors" in line and "-" in line:
            try:
                parts = line.split("-")
                for part in parts:
                    if "errors" in part:
                        num = part.strip().split()[0]
                        error_count = int(num)
                        break
            except (ValueError, IndexError):
                pass

    return error_count, output


def main():
    # リポジトリルートを検出（.gitがある場所）
    current = Path.cwd()
    root = current
    while root.parent != root:
        if (root / ".git").exists():
            break
        root = root.parent
    else:
        root = current

    print(f"Scanning for Astro projects in: {root}")
    print("-" * 60)

    projects = find_astro_projects(root)

    if not projects:
        print("No Astro projects found.")
        sys.exit(0)

    print(f"Found {len(projects)} Astro project(s):")
    for p in projects:
        print(f"  - {p.relative_to(root)}")
    print("-" * 60)

    total_errors = 0
    results = []

    for project in projects:
        project_name = project.relative_to(root)
        print(f"\n[{project_name}]")

        # @astrojs/check の確認・インストール
        if not check_astro_check_installed(project):
            print(f"  @astrojs/check not found. Installing...")
            if not install_astro_check(project):
                print(f"  Failed to install. Skipping.")
                continue

        # astro check 実行
        print(f"  Running astro check...")
        error_count, output = run_astro_check(project)
        total_errors += error_count

        results.append({
            "project": str(project_name),
            "errors": error_count,
            "output": output,
        })

        print(f"  Errors: {error_count}")

    # サマリー
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for r in results:
        status = "OK" if r["errors"] == 0 else f"{r['errors']} errors"
        print(f"  {r['project']}: {status}")
    print(f"\nTotal: {total_errors} error(s)")

    # 詳細出力（エラーがある場合）
    if total_errors > 0:
        print("\n" + "=" * 60)
        print("DETAILS")
        print("=" * 60)
        for r in results:
            if r["errors"] > 0:
                print(f"\n[{r['project']}]")
                print(r["output"])

    sys.exit(0 if total_errors == 0 else 1)


if __name__ == "__main__":
    main()
