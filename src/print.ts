import fs from 'fs';
import path from 'path';
import { CLIOptions } from './cli';
import { JsonCompatiblePrimitive } from './transform';

export function print(
    result: JsonCompatiblePrimitive,
    fileName: string,
    options: CLIOptions
) {
    const outputPath = options.output ?? 'mocks';
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }

    fs.writeFileSync(
        path.join(outputPath, fileName),
        typeof result === 'string' ? result : result.toString()
    );
}
