import './App.css'
import subsrt from './3rdparty/subsrt/subsrt'

import JSZip from 'jszip';
import streamSaver from 'streamsaver'

import { useState } from 'react';

import { styled } from '@mui/joy/styles';
import { Box, Button, Sheet, Stack } from '@mui/joy';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const InvisiableInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

const Item = styled(Sheet)(({ theme }) => ({
    ...theme.typography['body-sm'],
    textAlign: 'center',
    fontWeight: theme.fontWeight.md,
    color: theme.vars.palette.text.secondary,
    border: '1px solid',
    borderColor: theme.palette.divider,
    padding: theme.spacing(1),
    borderRadius: theme.radius.md,
}));

function App() {

    const extraExt = ['wav']

    // TODO
    const [smartRename, setSmartRename] = useState(true)

    const [vttFiles, setVttFiles] = useState([])

    const rename = (filename) => {
        filename = filename.split('.');
        filename.pop();
        if (smartRename) {
            while (extraExt.includes(filename.at(-1))) {
                filename.pop();
            }
        }
        filename.push('lrc')
        filename = filename.join('.')
        return filename
    }

    const handleUpload = (event) => {
        setVttFiles([...vttFiles, ...event.target.files].toSorted((a, b) => a.name.localeCompare(b.name)))
    }

    const handleDownload = async () => {
        const zip = new JSZip()
        const dfs = async (idx, len) => {
            if (idx >= len) {
                zip.generateAsync({ type: "blob" }).then((content) => {
                    const fileStream = streamSaver.createWriteStream('archive.zip')
                    new Response(content).body.pipeTo(fileStream)
                });
                return
            }
            const vttFile = vttFiles[idx]
            const reader = new FileReader()
            reader.onload = (event) => {
                const vtt = event.target.result
                const lrc = subsrt.convert(vtt, { format: "lrc" });
                zip.file(rename(vttFile.name), lrc)
                dfs(idx + 1, len)
            }
            reader.readAsText(vttFile)
        }
        dfs(0, vttFiles.length)
    }

    return (
        <Box sx={{
            width: '100%',
            padding: '10px 0px',
        }}>
            <Stack
                direction="column"
                spacing={1}
                sx={{
                    margin: '0px 10px',
                    justifyContent: "center",
                    alignItems: "stretch",
                }}
            >
                <Button
                    component='label'
                    variant='solid'
                    startDecorator={< FileUploadIcon />}
                >
                    选择文件
                    < InvisiableInput
                        type='file'
                        accept='.vtt'
                        onChange={handleUpload}
                        multiple
                    />
                </Button >
                <Button
                    variant='solid'
                    startDecorator={<FileDownloadIcon />}
                    onClick={handleDownload}
                >
                    转换并保存
                </Button>
                <Stack
                    direction="column"
                    spacing={1}
                    sx={{
                        justifyContent: "center",
                        alignItems: "stretch",
                    }}
                >
                    {
                        vttFiles.map((vttFile, index) => {
                            return <Item key={index}>{vttFile.name}</Item>
                        })
                    }
                </Stack >
            </Stack>
        </Box>
    );
}

export default App;
