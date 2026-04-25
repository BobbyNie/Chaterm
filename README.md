<div align="center">
  <a href="./README_zh.md">中文</a> / English / <a href="./README_ja.md">日本語</a>
</div>
<br>

> **This is an INTRANET EDITION** forked from [chaterm/Chaterm](https://github.com/chaterm/Chaterm)
> for internal network deployment without cloud service dependencies.
>
> - No login required - starts directly to main interface
> - No cloud sync - all data stays local
> - Date-based versioning (yyyy.MM.dd)
>
> For the original version with cloud features, visit [chaterm/Chaterm](https://github.com/chaterm/Chaterm).

<br>

<p align="center">
  <a href="https://www.tbench.ai/leaderboard/terminal-bench/1.0"><img src="https://img.shields.io/badge/Terminal--Bench-Ranked_%232-00D94E?style=for-the-badge&logo=github&logoColor=white" alt="Terminal-Bench"></a>
  <a href="https://aws.amazon.com/cn/blogs/china/chaterm-aws-kms-envelope-encryption-for-zero-trust-security-en/"><img src="https://img.shields.io/badge/AWS-Security-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white&labelColor=232F3E" alt="AWS Security"></a>
  <a href="https://landscape.cncf.io/?item=provisioning--automation-configuration--chaterm"><img src="https://img.shields.io/badge/CNCF-Landscape-0086FF?style=for-the-badge&logo=kubernetes&logoColor=white" alt="CNCF Landscape"></a>
</p>

<p align="center">
  <a href="https://scorecard.dev/viewer/?uri=github.com/chaterm/Chaterm"><img src="https://api.scorecard.dev/projects/github.com/chaterm/Chaterm/badge" alt="OpenSSF Scorecard"></a>
  <a href="https://www.bestpractices.dev/projects/12617"><img src="https://www.bestpractices.dev/projects/12617/badge" alt="OpenSSF Best Practices"></a>
  <img src="https://img.shields.io/codecov/c/github/chaterm/Chaterm?style=flat&logo=codecov" alt="Coverage">
  <img src="https://img.shields.io/badge/AI-Native-blue?style=flat" alt="AI Native">
  <a href="https://x.com/chaterm_ai"><img src="https://img.shields.io/twitter/follow/chaterm_ai?style=flat&logo=x&logoColor=white&label=Follow" alt="Follow on X"></a>
  <a href="https://discord.gg/AgsYzwRp62"><img src="https://img.shields.io/badge/discord-join-5865F2?logo=discord&logoColor=white" alt="Discord"></a>
</p>

<p align="center">
  <a href="https://chaterm.ai/download/"><img src="https://img.shields.io/badge/macOS-000000?style=for-the-badge&logo=apple&logoColor=white" alt="macOS"></a>
  <a href="https://chaterm.ai/download/"><img src="https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows"></a>
  <a href="https://chaterm.ai/download/"><img src="https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black" alt="Linux"></a>
  <a href="https://apps.apple.com/us/app/chaterm/id6754307456"><img src="https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=apple&logoColor=white" alt="iOS"></a>
  <a href="https://play.google.com/store/apps/details?id=com.intsig.chaterm.global"><img src="https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android"></a>
  <a href="https://aws.amazon.com/marketplace/"><img src="https://img.shields.io/badge/AWS-Marketplace-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white&labelColor=232F3E" alt="AWS Marketplace"></a>
  <p align="center">
</p>

## Table of Contents

- [Introduction](#introduction)
- [Why Choose Chaterm](#why-choose-chaterm)
- [Key Features](#key-features)
- [Development Guide](#development-guide)
  - [Install Electron](#install-electron)
  - [Install](#install)
  - [Development](#development)
  - [Build](#build)
- [Chaterm Documentation](https://chaterm.ai/docs/)
  - [Achieving Secure and Intelligent Operations for AWS Private Subnets Using Chaterm](https://aws.amazon.com/cn/blogs/china/bastion-using-aws-eice-ec2-instance-connect-endpoint-chaterm-implement-subnet-security-intelligent-en/)
  - [How Chaterm’s Security Architecture Ensures Data Security and Reliability](https://aws.amazon.com/cn/blogs/china/chaterm-aws-kms-envelope-encryption-for-zero-trust-security-en/)
  - [Enhancing DevOps Intelligence with Chaterm Skills and Qwen Large Models](https://chaterm.ai/blog/posts/agent-skills)
- [Gold Sponsors](#gold-sponsors)
- [Contributors](#contributors)

# Introduction

Chaterm is an AI native terminal built for infrastructure and cloud resource management. It enables engineers to use natural language to perform complex tasks such as deploying services, troubleshooting, and resolving problems.

With its built-in expert-level knowledge base and powerful proxy reasoning capabilities, Chatem understands your business topology and operational goals. No need to memorize complex commands, syntax, or parameters. simply describe your task objectives in natural language, and Chatem can autonomously plan and execute complex operations across multiple hosts or clusters, including key processes such as code building, service deployment, fault diagnosis, and automatic rollback.

Powered by long-term memory and team knowledge bases, Chaterm learns team knowledge and user habits. Its goal is to be your intelligent DevOps co-pilot, allowing engineers to complete daily tasks more efficiently through reusable agent skills. Chaterm aims to lower the cognitive barrier associated with different technology stacks, enabling every developer to quickly gain the operational experience and execution capabilities of a senior SRE.

![Preview image](resources/hero.webp)

![Preview image](resources/hero2.webp)

## Why Choose Chaterm

Chaterm is not just a smarter terminal, it's an infrastructure agent.
There is a saying that every agent fails all the time, but Chaterm helps you fix it.

- 🤖 From commands to execution — describe tasks, let AI plan and run them

- 🌐 Built for real infrastructure — Servers, Kubernetes, and multi-cluster workflows

- 🔁 Reusable Agent Skills — turn experience into automation

- 🧠 Context-aware intelligence — understands your systems, not just commands

- 🛡️ Safe & controllable — auditable, reviewable, and rollback-ready

## Key Features

- 🤖 **AI Agent**

  The Agent understands the target, autonomously plans, and performs problem analysis and root cause localization across multiple hosts, automatically closing the loop to complete complex process handling.

  Every operation is auditable and traceable, and supports rapid log rollback, making AI automation more secure and reliable in production environments.

- 🧠 **Smart completion**

  Combining user habits, local memory, and the current server context, the Agent recommends the most suitable commands, making terminal input smarter and more efficient.

  Supports cross-device session synchronization and reduces mobile input costs through quick commands and voice interaction, making remote maintenance smoother.

- 🧩 **Knowledge Base**

  Supports importing technical manuals, internal documents, scripts, and white papers to build a personal maintenance knowledge system.

  Chaterm understands the current infrastructure context and accurately retrieves relevant knowledge to assist in task decision-making and execution.

- ⚡ **Agent Skill**

  Encapsulates complex maintenance processes into reusable AI skills, achieving structured and reliable automated execution.

  Help teams accumulate operational experience, enabling AI to be applied securely and stably in real production environments.

- 🔌 **Plugin System**

  Through plugin extensions, achieve unified authentication, dynamic authorization, and secure encrypted connections for public cloud servers and Kubernetes.

  Provide a more efficient resource access experience and facilitate centralized infrastructure management.

![Preview image](resources/features.webp)

## Intranet Edition Notes

This project is forked from [chaterm/Chaterm](https://github.com/chaterm/Chaterm) for **internal network deployment** without cloud service dependencies.

### Why This Fork?

The original Chaterm requires cloud services for:
- User authentication (login/registration)
- Data synchronization across devices
- Subscription and billing management
- Cloud-based AI model access

For organizations that need to deploy in an isolated intranet environment, these cloud dependencies are not suitable. This fork removes all cloud-related features and provides a **completely offline** experience.

### Key Modifications

| Category | Original | Intranet Edition |
|----------|----------|------------------|
| Login System | Required login with phone/email | Auto-login as guest, no authentication needed |
| User Menu | Avatar with login/logout | Removed user menu from sidebar |
| Billing | Subscription management tab | Removed from settings |
| AI Tab | Shows login prompt without models | Only shows "Configure Model" button |
| Data Sync | Cloud sync across devices | All data stored locally |
| CI/CD | Manual releases | Automated builds on every push |
| Versioning | Semantic versioning (e.g., 0.9.3) | Date-based (yyyy.MM.dd) |
| Releases | Manual upload | Auto-creates GitHub Release |

### Guest User Details

The intranet edition automatically logs in as a guest user:
- **UID:** 999999999
- **Username:** guest
- **Email:** guest@chaterm.ai

### Build Artifacts

| Platform | Artifact Name | Notes |
|----------|--------------|-------|
| Windows x64 | `chaterm-{date}-cn-setup-x64.exe` | NSIS installer |
| macOS ARM64 | `chaterm-{date}-cn-macos-arm64.zip` | Apple Silicon |
| macOS x64 | `chaterm-{date}-cn-macos-x64.zip` | Intel Macs |

### Quick Start

1. **Download** the latest release from [Releases](https://github.com/BobbyNie/Chaterm/releases)
2. **Install** the application
3. **Configure AI Model**: Go to Settings → Models, add your local AI model or Ollama service
4. **Start Using**: No login required, all features are available immediately

### Syncing Upstream Updates

This fork periodically syncs with the upstream repository for bug fixes and improvements while preserving intranet-specific modifications:
- Cloud service code is excluded during merge
- Intranet-specific changes (no login, guest user) are preserved
- Security-related imports are removed when not needed

#### Recent Sync History

| Date | Upstream Version | Key Updates | Status |
|------|-----------------|-------------|--------|
| 2026-03-24 | 0.9.4 | K8s integration, Skills enhancements, Terminal improvements, Bug fixes | ✅ Synced |
| 2026-03-17 | 0.9.3 | Initial intranet fork, CI/CD setup, Feature removals | ✅ Complete |

**Latest Sync Details (2026-03-24):**
- Merged 151 commits from upstream
- Added K8s integration (741 lines)
- Added Skills enhancements (stage chat attachment)
- Fixed IndexedDB, file operations, shell handling
- Updated dependencies (xterm.js 6.0, AWS SDK, openai 6.32.0)
- All 129 intranet-specific tests passing
- Total test coverage: 2536+ tests

## Development Guide

### Install Electron

```sh
npm i electron -D
```

### Install

```bash
node scripts/patch-package-lock.js
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
# For windows
npm run build:win

# For macOS
npm run build:mac

# For Linux
npm run build:linux
```

## Gold Sponsors

![Preview image](resources/aws.webp) ![Preview image](resources/aliyun.webp)

## Contributors

Thank you for your contribution!
Please refer to the <a href="./CONTRIBUTING.md">Contribution Guide</a> for more information.

<div align=center style="margin-top: 30px;">
  <a href="https://github.com/chaterm/Chaterm/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=chaterm/Chaterm&refresh=true" />
  </a>
</div>
