import 'zx/globals'
import path from 'path'
import fs from 'fs/promises'
import { parse, stringify } from 'yaml'
import { chalk } from 'zx'

async function getPackageNames() {
  const packages = await fs.readdir(path.join(process.cwd(), 'packages'))
  let packageNames: string[] = []

  for (const packageName of packages) {
    const packagePath = path.join(process.cwd(), 'packages', packageName)
    const packageJSONPath = path.join(packagePath, 'package.json')

    const packageJSON = JSON.parse(await fs.readFile(packageJSONPath, 'utf8'))

    if (packageJSON.private) continue

    packageNames.push(packageJSON.name)
  }

  return packageNames
}

function actualizePartsAvailable(
  issueTemplate: any,
  templateConfig: { nonPackageParts?: string[] },
  packageParts: string[],
) {
  const block = issueTemplate?.body.find(
    (bodyBlock: Record<'type' | 'id', string>) =>
      bodyBlock.type === 'dropdown' && bodyBlock.id === 'reatom-part',
  )
  if (!block) return false

  block.attributes.options = [
    ...(templateConfig?.nonPackageParts ?? []),
    ...packageParts,
  ]
  echo(chalk.greenBright(issueTemplate?.name), 'available parts actualized')
  return true
}

const main = async () => {
  let packageNames = await getPackageNames()
  packageNames.sort()

  const packageParts = packageNames.map(
    (packageName) => `Package ${packageName}`,
  )

  const templateConfig: { nonPackageParts?: string[] } =
    parse(
      await fs.readFile(
        path.join(process.cwd(), '.github', 'ISSUE_TEMPLATE', 'config.yaml'),
        'utf-8',
      ),
    )?.['x-reatom'] ?? {}

  const issueTemplateFiles = await fs.readdir(
    path.join(process.cwd(), '.github', 'ISSUE_TEMPLATE'),
  )
  for (const issueTemplateFile of issueTemplateFiles) {
    if (issueTemplateFile === 'config.yaml') continue

    const issueTemplatePath = path.join(
      process.cwd(),
      '.github',
      'ISSUE_TEMPLATE',
      issueTemplateFile,
    )
    const issueTemplate = parse(await fs.readFile(issueTemplatePath, 'utf-8'))
    const changed = actualizePartsAvailable(
      issueTemplate,
      templateConfig,
      packageParts,
    )
    if (changed) await fs.writeFile(issueTemplatePath, stringify(issueTemplate))
  }
}

main()
