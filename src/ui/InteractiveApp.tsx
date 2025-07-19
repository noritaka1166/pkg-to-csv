import { useState } from 'react';
import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { CliOptions, SelectItem, InteractiveAppProps } from '../types/index.js';

export default function InteractiveApp({ onComplete }: InteractiveAppProps) {
  const [step, setStep] = useState<'main' | 'input' | 'output' | 'options' | 'confirm'>('main');
  const [options, setOptions] = useState<Partial<CliOptions>>({
    input: 'package.json'
  });

  const mainMenuItems: SelectItem[] = [
    { label: '📁 Input Path', value: 'input' },
    { label: '📝 Output File', value: 'output' },
    { label: '⚙️  Options', value: 'options' },
    { label: '✅ Start Processing', value: 'confirm' },
    { label: '🚪 Exit', value: 'exit' }
  ];

  const optionItems: SelectItem[] = [
    { label: `🔄 Latest Version Info: ${options.latest ? 'ON' : 'OFF'}`, value: 'latest' },
    { label: `📜 License Info: ${options.license ? 'ON' : 'OFF'}`, value: 'license' },
    { label: `📄 Description: ${options.description ? 'ON' : 'OFF'}`, value: 'description' },
    { label: `🔗 NPM Link: ${options.npmLink ? 'ON' : 'OFF'}`, value: 'npmLink' },
    { label: `📦 Dependencies Only: ${options.depsOnly ? 'ON' : 'OFF'}`, value: 'depsOnly' },
    { label: `🛠️  DevDependencies Only: ${options.devOnly ? 'ON' : 'OFF'}`, value: 'devOnly' },
    { label: `🔍 Recursive Search: ${options.recursive ? 'ON' : 'OFF'}`, value: 'recursive' },
    { label: '⬅️  Back to Main Menu', value: 'back' }
  ];

  const handleMainMenuSelect = (item: SelectItem) => {
    if (item.value === 'exit') {
      process.exit(0);
    }
    setStep(item.value as any);
  };

  const handleOptionToggle = (item: SelectItem) => {
    if (item.value === 'back') {
      setStep('main');
      return;
    }

    if (item.value === 'depsOnly' && options.devOnly) {
      setOptions(prev => ({ ...prev, devOnly: false, [item.value]: !prev[item.value as keyof CliOptions] }));
    } else if (item.value === 'devOnly' && options.depsOnly) {
      setOptions(prev => ({ ...prev, depsOnly: false, [item.value]: !prev[item.value as keyof CliOptions] }));
    } else {
      setOptions(prev => ({ ...prev, [item.value]: !prev[item.value as keyof CliOptions] }));
    }
  };

  const handleConfirm = (confirmed: boolean) => {
    if (confirmed) {
      // Clear the screen content but preserve terminal history
      process.stdout.write('\n');
      onComplete(options as CliOptions);
    } else {
      setStep('main');
    }
  };


  return (
    <Box flexDirection="column" paddingY={1}>
      <BigText text="PKG2CSV" colors={['cyan', 'magenta']} />
      
      <Box marginY={1}>
        <Text color="gray">Package.json Dependencies to CSV Converter</Text>
      </Box>

      {step === 'main' && (
        <Box flexDirection="column">
          <Box marginY={1}>
            <Text color="yellow">Current Settings:</Text>
          </Box>
          <Box flexDirection="column" marginBottom={1}>
            <Text>📁 Input: <Text color="green">{options.input}</Text></Text>
            <Text>📝 Output: <Text color="green">{options.output || 'packages.csv'}</Text></Text>
          </Box>
          <SelectInput items={mainMenuItems} onSelect={handleMainMenuSelect} />
        </Box>
      )}

      {step === 'input' && (
        <Box flexDirection="column">
          <Text color="cyan">Enter input path (package.json or directory):</Text>
          <TextInput
            value={options.input || ''}
            onChange={(value) => setOptions(prev => ({ ...prev, input: value }))}
            onSubmit={() => setStep('main')}
            placeholder="package.json"
          />
        </Box>
      )}

      {step === 'output' && (
        <Box flexDirection="column">
          <Text color="cyan">Enter output file path:</Text>
          <TextInput
            value={options.output as string || ''}
            onChange={(value) => setOptions(prev => ({ ...prev, output: value }))}
            onSubmit={() => setStep('main')}
            placeholder="packages.csv"
          />
        </Box>
      )}

      {step === 'options' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="cyan">Toggle Options:</Text>
          </Box>
          <SelectInput items={optionItems} onSelect={handleOptionToggle} />
        </Box>
      )}

      {step === 'confirm' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="yellow">Ready to process with these settings:</Text>
          </Box>
          <Box flexDirection="column" marginBottom={1}>
            <Text>📁 Input: <Text color="green">{options.input}</Text></Text>
            <Text>📝 Output: <Text color="green">{options.output || 'packages.csv'}</Text></Text>
            <Text>Options: <Text color="green">
              {[
                options.latest && 'latest',
                options.license && 'license', 
                options.description && 'description',
                options.npmLink && 'npm-link',
                options.depsOnly && 'deps-only',
                options.devOnly && 'dev-only',
                options.recursive && 'recursive'
              ].filter(Boolean).join(', ') || 'none'}
            </Text></Text>
          </Box>
          <SelectInput 
            items={[
              { label: '✅ Yes, proceed', value: 'yes' },
              { label: '❌ No, go back', value: 'no' }
            ]}
            onSelect={(item) => handleConfirm(item.value === 'yes')}
          />
        </Box>
      )}
    </Box>
  );
}