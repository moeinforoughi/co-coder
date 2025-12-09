let pyodideInstance = null;
let pyodideLoading = false;
let pyodideLoadCallbacks = [];

// Initialize Pyodide (lazy loading)
async function initPyodide() {
    if (pyodideInstance) return pyodideInstance;

    if (pyodideLoading) {
        // Wait for the existing load to complete
        return new Promise((resolve) => {
            pyodideLoadCallbacks.push(resolve);
        });
    }

    pyodideLoading = true;

    try {
        const { loadPyodide } = await import('pyodide');
        pyodideInstance = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
        });

        // Resolve all waiting callbacks
        pyodideLoadCallbacks.forEach(callback => callback(pyodideInstance));
        pyodideLoadCallbacks = [];

        return pyodideInstance;
    } catch (error) {
        pyodideLoading = false;
        throw error;
    }
}

// Execute Python code using Pyodide
export async function executePython(code) {
    try {
        const pyodide = await initPyodide();

        // Redirect stdout to capture print statements
        const result = await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()

try:
    ${code.split('\n').map(line => '    ' + line).join('\n')}
    stdout_value = sys.stdout.getvalue()
    stderr_value = sys.stderr.getvalue()
    
    if stderr_value:
        stderr_value
    else:
        stdout_value if stdout_value else "Code executed successfully (no output)"
except Exception as e:
    str(e)
    `);

        return {
            success: true,
            output: result || 'Code executed successfully (no output)'
        };
    } catch (error) {
        return {
            success: false,
            output: `Error: ${error.message}`
        };
    }
}

// Execute JavaScript code
export function executeJavaScript(code) {
    try {
        // Create a safe execution context
        const logs = [];
        const customConsole = {
            log: (...args) => logs.push(args.join(' ')),
            error: (...args) => logs.push('Error: ' + args.join(' ')),
            warn: (...args) => logs.push('Warning: ' + args.join(' '))
        };

        // Create a function with the code and execute it
        const func = new Function('console', code);
        const result = func(customConsole);

        // If there's a return value and no console output, show it
        const output = logs.length > 0
            ? logs.join('\n')
            : (result !== undefined ? String(result) : 'Code executed successfully (no output)');

        return {
            success: true,
            output
        };
    } catch (error) {
        return {
            success: false,
            output: `Error: ${error.message}`
        };
    }
}

// Main execute function
export async function executeCode(code, language) {
    if (!code.trim()) {
        return {
            success: false,
            output: 'No code to execute'
        };
    }

    if (language === 'python') {
        return await executePython(code);
    } else if (language === 'javascript') {
        return executeJavaScript(code);
    } else {
        return {
            success: false,
            output: `Language ${language} is not supported`
        };
    }
}
