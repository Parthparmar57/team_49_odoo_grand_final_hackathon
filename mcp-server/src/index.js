import express from 'express';
import dotenv from 'dotenv';
import { mcpTools } from './tools/index.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.MCP_SERVER_PORT || 3001;

app.get('/tools', (req, res) => {
    return res.json({
        tools: mcpTools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
        })),
    });
});

app.post('/tools/:name', async (req, res) => {
    const toolName = req.params.name;
    const tool = mcpTools.find((t) => t.name === toolName);

    if (!tool) {
        return res.status(404).json({ success: false, error: `MCP Tool '${toolName}' not found.` });
    }

    try {
        const result = await tool.handler(req.body);
        return res.json({ success: true, tool: toolName, result });
    } catch (error) {
        return res.status(500).json({ success: false, tool: toolName, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🔌 PeoplePay360 MCP Server (JavaScript) listening on port ${PORT}`);
});
