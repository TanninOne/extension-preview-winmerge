import { spawn } from 'child_process';
import * as path from 'path';
import * as React from 'react';
import { createAction } from 'redux-act';
import { types, Icon, tooltip, util } from 'vortex-api';
import { InputGroup, FormControl, HelpBlock } from 'react-bootstrap';

const DEFAULT_PATH = String.raw`C:\Program Files (x86)\WinMerge\WinMergeU.exe`;

function previewHandler(api: types.IExtensionApi, winmergePath: string, files: any) {
  return new Promise((resolve, reject) => {
    try {
      const proc = spawn(winmergePath, [files[0].filePath, files[1].filePath]);
      proc
        .on('error', err => {
          reject(err);
        })
        .on('exit', () => {
          resolve(null);
        });
    } catch (err) {
      reject(err);
    }
  });
}

interface IWinMergePathComponentProps {
  t: types.TFunction;
  api: types.IExtensionApi;
  winmergePath: string;
  onSetPath: (input: string) => void;
}

function WinMergePathComponent(props: IWinMergePathComponentProps) {
  const { t, api, onSetPath } = props;

  const [ value, setValue ] = React.useState(props.winmergePath);

  const setPathCB = React.useCallback((evt: React.KeyboardEvent<HTMLInputElement>) => {
    setValue(evt.currentTarget.value);
  }, [setValue]);

  const apply = React.useCallback(() => {
    onSetPath(value);
  }, [value, onSetPath]);

  const browsePath = React.useCallback(() => { 
    api.selectExecutable({
      defaultPath: value,
      filters: [{ name: 'WinMerge Executable', extensions: ['exe', 'cmd', 'bat'] }]
    })
    .then((selectedPath: string) => {
      if (selectedPath) {
        setValue(selectedPath);
      }
    });
  }, [setValue, value]);

  return (
    <>
      <HelpBlock>
        {t('Please select the path to the winmerge executable (WinMergeU.exe) or any other '
          + 'diff application you may want to use that uses the same command line parameters '
          + '(Beyond Compare works nicely for example).')}
      </HelpBlock>
      <InputGroup>
        <FormControl
          className='winmerge-path-input'
          style={{ minWidth: '64ch' }}
          value={value}
          placeholder={DEFAULT_PATH}
          onChange={setPathCB}
        />
        <InputGroup.Button className='inset-btn'>
          <tooltip.Button
            tooltip={t('Browse')}
            onClick={browsePath}
          >
            <Icon name='browse' />
          </tooltip.Button>
        </InputGroup.Button>
      </InputGroup>
      <tooltip.Button tooltip={t('Click to save path')} onClick={apply}>
        {t('Apply')}
      </tooltip.Button>
    </>
  );
}

const setWinmergePath = createAction('SET_PATH_WINMERGE', (input: string) => input);

function init(context: types.IExtensionContext) {
  context.registerReducer(['settings', 'tools'], {
    defaults: { winmergePath: DEFAULT_PATH },
    reducers: { [setWinmergePath as any]: (state, payload) => util.setSafe(state, ['winmergePath'], payload) },
  });

  context.registerPreview(150, (files: any[], allowPick: boolean) => {
    const state: any = context.api.getState();
    return previewHandler(context.api, state.settings.tools.winmergePath, files);
  });

  context.registerSettings('Tools', WinMergePathComponent, () => ({
    t: context.api.translate,
    api: context.api,
    onSetPath: input => context.api.store.dispatch(setWinmergePath(input)),
    winmergePath: context.api.getState<any>().settings.tools.winmergePath,
  }));
}

export default init;
