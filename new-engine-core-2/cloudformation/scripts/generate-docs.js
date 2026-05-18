import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputReadmePath = path.join(__dirname, '../docs/README.md');

// Array of configuration objects for each template file
const configurations = [
    {
        headerName: 'CX Template Resource Index',
        filePath: path.join(__dirname, '../templates/modules/cx.yaml'),
        description:
            'This file indexes the major sections within the `templates/module/cx.yaml` template, detailing the start and end lines for each.',
        type: 'module',
    },
    {
        headerName: 'EC2 Template Resource Index',
        filePath: path.join(__dirname, '../templates/core/ec2.yaml'),
        description:
            'This file indexes the major sections within the `templates/core/ec2.yaml` template, detailing the start and end lines for each.',
        type: 'core',
    },
    {
        headerName: 'RDS Template Resource Index',
        filePath: path.join(__dirname, '../templates/core/rds.yaml'),
        description:
            'This file indexes the major sections within the `templates/core/rds.yaml` template, detailing the start and end lines for each.',
        type: 'core',
    },
    {
        headerName: 'VPC Template Resource Index',
        filePath: path.join(__dirname, '../templates/core/vpc.yaml'),
        description:
            'This file indexes the major sections within the `templates/core/vpc.yaml` template, detailing the start and end lines for each.',
        type: 'core',
    },
    {
        headerName: 'Web UI Template Resource Index',
        filePath: path.join(__dirname, '../templates/core/web-ui.yaml'),
        description:
            'This file indexes the major sections within the `templates/core/web-ui.yaml` template, detailing the start and end lines for each.',
        type: 'core',
    },
    {
        headerName: 'GA Template Resource Index',
        filePath: path.join(__dirname, '../templates/modules/ga.yaml'),
        description:
            'This file indexes the major sections within the `templates/modules/ga.yaml.yaml` template, detailing the start and end lines for each.',
        type: 'module',
    },
    {
        headerName: 'WAF Template Resource Index',
        filePath: path.join(__dirname, '../templates/core/waf.yaml'),
        description:
            'This file indexes the major sections within the `templates/core/waf.yaml` template, detailing the start and end lines for each.',
        type: 'core',
    },
    {
        headerName: 'CMS Template Resource Index',
        filePath: path.join(__dirname, '../templates/modules/cms.yaml'),
        description:
            'This file indexes the major sections within the `templates/modules/cms.yaml` template, detailing the start and end lines for each.',
        type: 'module',
    },
    // Add other template configurations here in the future
];

async function parseTemplateFile(filePath) {
    const data = await fs.readFile(filePath, 'utf8');
    const lines = data.split('\n');
    const sections = [];
    let currentSection = null;

    const headerRegex = /^\s*#\s*\d+\.\s*(.*)/;

    lines.forEach((line, index) => {
        const match = line.match(headerRegex);
        const lineNumber = index + 1;

        if (match) {
            if (currentSection) {
                currentSection.end = lineNumber - 3;
                sections.push(currentSection);
            }
            currentSection = {
                name: match[1].replace(/=+/g, '').trim(),
                start: lineNumber,
                end: null,
            };
        }
    });

    if (currentSection) {
        currentSection.end = lines.length;
        sections.push(currentSection);
    }
    return sections;
}

async function generateDocs() {
    try {
        let headerContent =
            '# CloudFormation Templates Documentation\n\nThis document provides an index of the major sections within the CloudFormation templates.\n\n';
        let coreToc = '## Core Templates\n\n';
        let moduleToc = '## Module Templates\n\n';
        let coreBody = '';
        let moduleBody = '';

        for (const config of configurations) {
            const headerId = config.headerName.toLowerCase().replace(/\s+/g, '-');
            const tocEntry = `* [${config.headerName}](#${headerId})\n`;
            let bodyEntry = '';

            try {
                const sections = await parseTemplateFile(config.filePath);

                bodyEntry += `<a name="${headerId}"></a>\n# ${config.headerName}\n\n`;
                bodyEntry += `${config.description}\n\n`;
                bodyEntry += '| Section Name | Start Line | End Line |\n';
                bodyEntry += '|--------------|------------|----------|\n';

                for (const section of sections) {
                    bodyEntry += `| ${section.name} | ${section.start} | ${section.end} |\n`;
                }
                bodyEntry += '\n\n'; // Add space between tables
            } catch (fileError) {
                // If a file doesn't exist or has errors, note it and continue
                bodyEntry += `# ${config.headerName}\n\n`;
                bodyEntry += `Could not process file: ${config.filePath}. Please check the path and file format.\n\n`;
                console.error(`Error processing ${config.filePath}:`, fileError);
            }

            if (config.type === 'core') {
                coreToc += tocEntry;
                coreBody += bodyEntry;
            } else if (config.type === 'module') {
                moduleToc += tocEntry;
                moduleBody += bodyEntry;
            }
        }

        const readmeContent = headerContent + coreToc + '\n' + moduleToc + '\n' + coreBody + moduleBody;
        await fs.writeFile(outputReadmePath, readmeContent.trim(), 'utf8');
        console.log(`Successfully generated README.md at ${outputReadmePath}`);
    } catch (err) {
        console.error('Error generating README:', err);
    }
}

generateDocs();
