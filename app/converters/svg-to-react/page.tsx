'use client';

import { useState, useEffect } from 'react';

export default function SvgToReact() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showInput, setShowInput] = useState(false);
    const [directInput, setDirectInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [componentName, setComponentName] = useState('SvgIcon');

    const handlePaste = async (e: ClipboardEvent) => {
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
            return;
        }

        try {
            const text = e.clipboardData?.getData('text');
            if (text) {
                setInput(text);
                await convertSvgToReact(text);
            }
        } catch (error) {
            console.error('붙여넣기 실패:', error);
            alert('클립보드에서 가져오지 못했습니다');
        }
    };

    const convertSvgToReact = async (svg: string) => {
        try {
            setIsLoading(true);
            setError(null);

            if (!svg.trim().toLowerCase().includes('<svg')) {
                throw new Error('유효한 SVG 코드가 아닙니다.');
            }

            // SVG 속성을 React 스타일로 변환
            let jsxCode = svg
                .replace(/class=/g, 'className=')
                .replace(/stroke-width=/g, 'strokeWidth=')
                .replace(/stroke-linecap=/g, 'strokeLinecap=')
                .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
                .replace(/fill-rule=/g, 'fillRule=')
                .replace(/clip-rule=/g, 'clipRule=')
                .replace(/stroke-dasharray=/g, 'strokeDasharray=')
                .replace(/stroke-dashoffset=/g, 'strokeDashoffset=')
                .replace(/font-family=/g, 'fontFamily=')
                .replace(/font-size=/g, 'fontSize=')
                .replace(/text-anchor=/g, 'textAnchor=')
                .replace(/stop-color=/g, 'stopColor=')
                .replace(/stop-opacity=/g, 'stopOpacity=')
                .replace(/fill-opacity=/g, 'fillOpacity=')
                .replace(/stroke-opacity=/g, 'strokeOpacity=');

            // width와 height 속성을 props로 변환
            jsxCode = jsxCode.replace(
                /<svg([^>]*)>/,
                (match, attributes) => {
                    const processedAttributes = attributes
                        .replace(/width="[^"]*"/, 'width={width}')
                        .replace(/height="[^"]*"/, 'height={height}')
                        .replace(/class="[^"]*"/, 'className={className}');
                    return `<svg${processedAttributes}>`;
                }
            );

            // 컴포넌트 props 타입 정의
            const typeDefinition = `interface ${componentName}Props {
  className?: string;
  width?: number | string;
  height?: number | string;
}`;

            // React 컴포넌트 생성
            const componentCode = `import { forwardRef, SVGProps } from 'react';

${typeDefinition}

const ${componentName} = forwardRef<SVGSVGElement, ${componentName}Props>((props, ref) => {
  const { className, width, height, ...rest } = props;
  return (
    ${jsxCode}
  );
});

${componentName}.displayName = '${componentName}';

export default ${componentName};`;

            setOutput(componentCode);
        } catch (error) {
            console.error('SVG 변환 중 오류 발생:', error);
            setError('SVG를 React 컴포넌트로 변환하는 중 오류가 발생했습니다. SVG 코드를 확인해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (directInput.trim()) {
            setInput(directInput);
            await convertSvgToReact(directInput);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(output);
            alert('클립보드에 복사되었습니다!');
        } catch (error) {
            console.error('복사 실패:', error);
            alert('클립보드에 복사하지 못했습니다');
        }
    };

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, []);

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">SVG → React 변환기</h1>
                <div className="mb-6">
                    <p className="mb-2 text-gray-600">
                        SVG 코드를 복사한 후 이 페이지에서 <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">V</kbd> 를 눌러주세요.
                    </p>
                    <button
                        onClick={() => setShowInput(!showInput)}
                        className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                        {showInput ? '직접 입력 숨기기' : '또는 직접 입력하기'}
                    </button>
                </div>

                {showInput && (
                    <form onSubmit={handleSubmit} className="mb-6">
                        <div className="space-y-2">
                            <div className="flex items-center space-x-4">
                                <label className="text-sm text-gray-600">
                                    컴포넌트 이름:
                                </label>
                                <input
                                    type="text"
                                    value={componentName}
                                    onChange={(e) => setComponentName(e.target.value)}
                                    className="px-3 py-1 border rounded text-sm"
                                    placeholder="SvgIcon"
                                />
                            </div>
                            <textarea
                                value={directInput}
                                onChange={(e) => setDirectInput(e.target.value)}
                                className="w-full h-48 p-4 border rounded-lg font-mono text-sm"
                                placeholder="SVG 코드를 여기에 입력하세요..."
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                                disabled={!directInput.trim() || isLoading}
                            >
                                {isLoading ? '변환 중...' : '변환하기'}
                            </button>
                        </div>
                    </form>
                )}

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}

                {input && !error && (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">입력된 SVG:</h2>
                            <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm overflow-auto max-h-48">
                                {input}
                            </pre>
                        </div>

                        {output && !isLoading && (
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-xl font-semibold">React 컴포넌트:</h2>
                                    <button
                                        onClick={copyToClipboard}
                                        className="text-blue-500 hover:text-blue-600 text-sm"
                                    >
                                        클립보드에 복사
                                    </button>
                                </div>
                                <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm overflow-auto max-h-96">
                                    {output}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 