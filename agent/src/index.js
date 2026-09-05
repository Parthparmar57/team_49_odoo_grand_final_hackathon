import express from 'express';
import dotenv from 'dotenv';
import { HROrchestratorAgent } from './agents/HROrchestratorAgent.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.AGENT_PORT || 3002;

app.post('/agent/process-email', async (req, res) => {
    try {
        const result = await HROrchestratorAgent.runLeaveEmailWorkflow(req.body);
        return res.json({ success: true, result });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🤖 PeoplePay360 AI Agent Service (JavaScript) listening on port ${PORT}`);
});
