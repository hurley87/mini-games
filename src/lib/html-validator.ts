import { JSDOM } from 'jsdom';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FixableHtmlResult {
  isValid: boolean;
  fixedHtml?: string;
  errors: string[];
  warnings: string[];
}

/**
 * Validates HTML content for common syntax errors and structural issues
 */
export function validateHtml(html: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Basic syntax checks
    if (!html.trim()) {
      errors.push('HTML content is empty');
      return { isValid: false, errors, warnings };
    }

    // Check for basic HTML structure
    if (!html.includes('<html') && !html.includes('<HTML')) {
      errors.push('Missing <html> tag');
    }

    if (!html.includes('<body') && !html.includes('<BODY')) {
      errors.push('Missing <body> tag');
    }

    // Check for unclosed tags (basic regex checks)
    const unclosedTags = findUnclosedTags(html);
    if (unclosedTags.length > 0) {
      errors.push(`Unclosed tags detected: ${unclosedTags.join(', ')}`);
    }

    // Check for mismatched quotes
    const quoteErrors = findQuoteErrors(html);
    if (quoteErrors.length > 0) {
      errors.push(`Quote mismatch errors: ${quoteErrors.join(', ')}`);
    }

    // Try to parse with JSDOM for more thorough validation
    try {
      const dom = new JSDOM(html, {
        pretendToBeVisual: false,
        resources: 'usable',
      });

      // Check for script errors in the parsed DOM
      const scripts = dom.window.document.querySelectorAll('script');
      scripts.forEach((script: Element, index: number) => {
        if (script.textContent) {
          const jsErrors = validateJavaScript(script.textContent);
          if (jsErrors.length > 0) {
            warnings.push(
              `Script ${index + 1} has potential issues: ${jsErrors.join(', ')}`
            );
          }
        }
      });
    } catch (domError) {
      errors.push(
        `DOM parsing error: ${
          domError instanceof Error ? domError.message : 'Unknown error'
        }`
      );
    }

    // Check for common game-breaking patterns
    const gameIssues = checkGameSpecificIssues(html);
    warnings.push(...gameIssues);
  } catch (error) {
    errors.push(
      `Validation error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Attempts to fix common HTML syntax errors
 */
export function validateAndFixHtml(html: string): FixableHtmlResult {
  const validation = validateHtml(html);

  if (validation.isValid) {
    return {
      isValid: true,
      fixedHtml: html,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  // Attempt to fix common issues
  let fixedHtml = html;
  const fixAttempts: string[] = [];

  try {
    // Fix missing DOCTYPE first
    if (!fixedHtml.includes('<!DOCTYPE html>')) {
      fixedHtml = '<!DOCTYPE html>\n' + fixedHtml;
    }

    // Fix missing html tags
    if (!fixedHtml.includes('<html')) {
      // Extract DOCTYPE if present to keep it outside html tags
      const doctypeMatch = fixedHtml.match(/<!DOCTYPE html>\s*/i);
      let doctype = '';
      let content = fixedHtml;

      if (doctypeMatch) {
        doctype = doctypeMatch[0];
        content = fixedHtml.replace(/<!DOCTYPE html>\s*/i, '');
      }

      if (!content.startsWith('<html')) {
        fixedHtml = doctype + '<html>\n' + content + '\n</html>';
        fixAttempts.push('Added missing <html> tags');
      }
    }

    if (!fixedHtml.includes('<body')) {
      // Find where to insert body tag
      const headMatch = fixedHtml.match(/<\/head>/i);
      if (headMatch) {
        fixedHtml = fixedHtml.replace(/<\/head>/i, '</head>\n<body>\n');

        // Insert </body> before </html> if it exists, otherwise append to end
        const htmlCloseMatch = fixedHtml.match(/<\/html>/i);
        if (htmlCloseMatch) {
          fixedHtml = fixedHtml.replace(/<\/html>/i, '</body>\n</html>');
        } else {
          fixedHtml = fixedHtml + '\n</body>';
        }
      } else {
        const htmlMatch = fixedHtml.match(/<html[^>]*>/i);
        if (htmlMatch) {
          fixedHtml = fixedHtml.replace(
            /<html[^>]*>/i,
            htmlMatch[0] + '\n<body>\n'
          );

          // Insert </body> before </html> if it exists, otherwise append to end
          const htmlCloseMatch = fixedHtml.match(/<\/html>/i);
          if (htmlCloseMatch) {
            fixedHtml = fixedHtml.replace(/<\/html>/i, '</body>\n</html>');
          } else {
            fixedHtml = fixedHtml + '\n</body>';
          }
        }
      }
      fixAttempts.push('Added missing <body> tags');
    }

    // Attempt to fix unclosed tags (basic fixes)
    fixedHtml = fixBasicUnclosedTags(fixedHtml);
    if (fixedHtml !== html) {
      fixAttempts.push('Fixed unclosed tags');
    }

    // Re-validate the fixed HTML
    const revalidation = validateHtml(fixedHtml);

    return {
      isValid: revalidation.isValid,
      fixedHtml: revalidation.isValid ? fixedHtml : undefined,
      errors: revalidation.errors,
      warnings: [
        ...revalidation.warnings,
        ...fixAttempts.map((attempt) => `Auto-fix: ${attempt}`),
      ],
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        ...validation.errors,
        `Fix attempt failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      ],
      warnings: validation.warnings,
    };
  }
}

/**
 * Creates a safe fallback HTML for when validation fails
 */
export function createErrorFallbackHtml(errorMessage: string): string {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Error</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
        }
        .error-container {
            background: rgba(0, 0, 0, 0.3);
            padding: 30px;
            border-radius: 10px;
            max-width: 400px;
        }
        h1 { margin-top: 0; }
        .retry-btn {
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 15px;
        }
        .retry-btn:hover {
            background: #ff5252;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>🎮 Game Error</h1>
        <p>There was an issue loading this game.</p>
        <p><small>${errorMessage}</small></p>
        <button class="retry-btn" onclick="window.location.reload()">
            Retry
        </button>
    </div>
</body>
</html>`;
}

// Helper functions

function findUnclosedTags(html: string): string[] {
  const unclosed: string[] = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  const tagStack: string[] = [];
  const selfClosingTags = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ]);

  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();

    if (selfClosingTags.has(tagName) || fullTag.endsWith('/>')) {
      continue; // Self-closing tag, skip
    }

    if (fullTag.startsWith('</')) {
      // Closing tag - find matching opening tag
      const matchIndex = tagStack.lastIndexOf(tagName);
      if (matchIndex >= 0) {
        // Found matching opening tag - all tags opened after it are unclosed
        const unclosedTags = tagStack.splice(matchIndex + 1);
        unclosed.push(...unclosedTags);
        // Remove the matched opening tag
        tagStack.pop();
      }
      // If no matching opening tag found, this closing tag is orphaned (ignore)
    } else {
      // Opening tag
      tagStack.push(tagName);
    }
  }

  // Any remaining tags in stack are unclosed
  unclosed.push(...tagStack);

  return [...new Set(unclosed)]; // Remove duplicates
}

function findQuoteErrors(html: string): string[] {
  const errors: string[] = [];
  const attributeRegex = /(\w+)=([^>\s]+)/g;

  let match;
  while ((match = attributeRegex.exec(html)) !== null) {
    const value = match[2];

    // Check if attribute value should be quoted but isn't
    if (!value.startsWith('"') && !value.startsWith("'")) {
      if (value.includes(' ') || value.includes('<') || value.includes('>')) {
        errors.push(`Unquoted attribute value: ${match[1]}=${value}`);
      }
    }

    // Check for mismatched quotes
    if (
      (value.startsWith('"') && !value.endsWith('"')) ||
      (value.startsWith("'") && !value.endsWith("'"))
    ) {
      errors.push(`Mismatched quotes in attribute: ${match[1]}=${value}`);
    }
  }

  return errors;
}

function validateJavaScript(jsCode: string): string[] {
  const errors: string[] = [];

  try {
    // Basic syntax check - look for common issues
    if (jsCode.includes('function(') && !jsCode.includes('}')) {
      errors.push('Possible unclosed function');
    }

    if (jsCode.includes('{') && !jsCode.includes('}')) {
      errors.push('Possible unclosed block');
    }

    // Count brackets
    const openBrackets = (jsCode.match(/\{/g) || []).length;
    const closeBrackets = (jsCode.match(/\}/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push(
        `Bracket mismatch: ${openBrackets} opening, ${closeBrackets} closing`
      );
    }

    // Count parentheses
    const openParens = (jsCode.match(/\(/g) || []).length;
    const closeParens = (jsCode.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(
        `Parentheses mismatch: ${openParens} opening, ${closeParens} closing`
      );
    }
  } catch (error) {
    errors.push(
      `JavaScript validation error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }

  return errors;
}

function checkGameSpecificIssues(html: string): string[] {
  const warnings: string[] = [];

  // Check for canvas element (required for most games)
  if (!html.includes('<canvas')) {
    warnings.push('No canvas element found - games typically require a canvas');
  }

  // Check for window.awardPoints usage
  if (html.includes('window.awardPoints') && !html.includes('tryAwardPoints')) {
    warnings.push(
      'Direct window.awardPoints usage detected - consider using tryAwardPoints helper'
    );
  }

  // Check for external dependencies
  if (html.includes('src="http') || html.includes("src='http")) {
    warnings.push(
      'External script/resource dependencies detected - may cause loading issues'
    );
  }

  return warnings;
}

function fixBasicUnclosedTags(html: string): string {
  // This is a very basic fix - in production you'd want more sophisticated logic
  let fixed = html;

  // Common self-closing tags that might be missing the slash
  const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link'];

  selfClosingTags.forEach((tag) => {
    const regex = new RegExp(`<${tag}([^>]*)(?<!/)>`, 'gi');
    fixed = fixed.replace(regex, `<${tag}$1/>`);
  });

  return fixed;
}
