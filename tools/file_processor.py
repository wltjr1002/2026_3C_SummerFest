#!/usr/bin/env python3
"""Small helper for preparing per-game resource input/output folders."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESOURCES_DIR = ROOT / "resources"


def game_paths(game_name: str) -> tuple[Path, Path, Path]:
    game_dir = RESOURCES_DIR / game_name
    input_dir = game_dir / "input"
    output_dir = game_dir / "output"
    return game_dir, input_dir, output_dir


def init_game(game_name: str) -> None:
    game_dir, input_dir, output_dir = game_paths(game_name)
    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Created resource folders: {game_dir.relative_to(ROOT)}")


def copy_input_to_output(game_name: str) -> None:
    _, input_dir, output_dir = game_paths(game_name)
    if not input_dir.exists():
        raise SystemExit(f"Input folder does not exist: {input_dir.relative_to(ROOT)}")

    output_dir.mkdir(parents=True, exist_ok=True)
    copied = 0
    for source in input_dir.rglob("*"):
        if not source.is_file():
            continue

        destination = output_dir / source.relative_to(input_dir)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        copied += 1

    print(f"Copied {copied} file(s) to {output_dir.relative_to(ROOT)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Prepare and process per-game resource files."
    )
    parser.add_argument("game", help="Game resource folder name, for example bingo")
    parser.add_argument(
        "--init",
        action="store_true",
        help="Create resources/<game>/input and resources/<game>/output folders.",
    )
    parser.add_argument(
        "--copy",
        action="store_true",
        help="Copy files from input to output as a placeholder processing step.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.init:
        init_game(args.game)

    if args.copy:
        copy_input_to_output(args.game)

    if not args.init and not args.copy:
        raise SystemExit("Choose at least one action: --init or --copy")


if __name__ == "__main__":
    main()
