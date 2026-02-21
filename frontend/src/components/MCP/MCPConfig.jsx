/**
 * PROJEKT GENESIS Sprint 4: MCP Config Generator
 * Generate Claude Desktop config for Vault spaces
 */

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Terminal as TerminalIcon,
  Build as ToolIcon,
  Description as ResourceIcon,
  QuestionAnswer as PromptIcon,
  Link as LinkIcon
} from "@mui/icons-material";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:9506";

function CodeBlock({ code, language = "json" }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Paper sx={{ position: "relative", bgcolor: "#1e1e1e", p: 2, borderRadius: 1 }}>
      <Tooltip title={copied ? "Copied!" : "Copy"}>
        <IconButton
          size="small"
          onClick={handleCopy}
          sx={{ position: "absolute", top: 8, right: 8, color: "grey.400" }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </IconButton>
      </Tooltip>
      <Box
        component="pre"
        sx={{
          m: 0,
          overflow: "auto",
          color: "#d4d4d4",
          fontFamily: "monospace",
          fontSize: "0.875rem"
        }}
      >
        {code}
      </Box>
    </Paper>
  );
}

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function MCPConfig({ spaceId, spaceName }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [branch, setBranch] = useState("main");
  const [customName, setCustomName] = useState("");
  const [tabValue, setTabValue] = useState(0);
  
  const generateConfig = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/mcp/config/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id: spaceId,
          branch: branch,
          name: customName || undefined
        })
      });
      
      if (!res.ok) throw new Error("Failed to generate config");
      
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        🔌 MCP Integration
      </Typography>
      <Typography color="text.secondary" paragraph>
        Connect this vault space to Claude Desktop or other MCP-compatible AI assistants.
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Configuration</Typography>
          
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Space ID"
              value={spaceId}
              disabled
              size="small"
              sx={{ flexGrow: 1 }}
            />
            <TextField
              label="Branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              size="small"
              sx={{ width: 150 }}
            />
            <TextField
              label="Server Name (optional)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={`vault-${spaceId.slice(0, 8)}`}
              size="small"
              sx={{ width: 200 }}
            />
          </Box>
          
          <Button
            variant="contained"
            onClick={generateConfig}
            disabled={loading}
            startIcon={<TerminalIcon />}
          >
            {loading ? "Generating..." : "Generate Config"}
          </Button>
        </CardContent>
      </Card>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {config && (
        <Card>
          <CardContent>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Claude Desktop" />
              <Tab label="Capabilities" />
              <Tab label="Usage" />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <Typography variant="subtitle1" gutterBottom>
                Add to <code>claude_desktop_config.json</code>:
              </Typography>
              <CodeBlock code={JSON.stringify(config.config, null, 2)} />
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Setup:</strong>
                <ol style={{ margin: "8px 0", paddingLeft: 20 }}>
                  <li>Set <code>VAULT_TOKEN</code> environment variable</li>
                  <li>Restart Claude Desktop</li>
                  <li>The server will appear in your MCP connections</li>
                </ol>
              </Alert>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>Available Tools</Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><ToolIcon color="primary" /></ListItemIcon>
                  <ListItemText
                    primary="vault_commit"
                    secondary="Commit changes to the vault"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ToolIcon color="primary" /></ListItemIcon>
                  <ListItemText
                    primary="vault_branch"
                    secondary="Create new branches"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ToolIcon color="primary" /></ListItemIcon>
                  <ListItemText
                    primary="vault_search"
                    secondary="Search files in the vault"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ToolIcon color="primary" /></ListItemIcon>
                  <ListItemText
                    primary="vault_history"
                    secondary="View commit history"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ToolIcon color="primary" /></ListItemIcon>
                  <ListItemText
                    primary="vault_diff"
                    secondary="Compare versions"
                  />
                </ListItem>
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Available Prompts</Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><PromptIcon color="secondary" /></ListItemIcon>
                  <ListItemText
                    primary="analyze_document"
                    secondary="Deep analysis of vault documents"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PromptIcon color="secondary" /></ListItemIcon>
                  <ListItemText
                    primary="summarize_changes"
                    secondary="Summarize recent modifications"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PromptIcon color="secondary" /></ListItemIcon>
                  <ListItemText
                    primary="extract_data"
                    secondary="Extract structured data (ETIM, etc.)"
                  />
                </ListItem>
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Resources</Typography>
              <Alert severity="success">
                All files in your vault are exposed as MCP resources with URI format:
                <Box component="code" sx={{ display: "block", mt: 1 }}>
                  vault://{spaceId}/{branch}/path/to/file
                </Box>
              </Alert>
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>Example Usage in Claude</Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Reading a file:
              </Typography>
              <CodeBlock
                code={`"Read the contents of vault://${spaceId}/${branch}/README.md"`}
              />
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Committing changes:
              </Typography>
              <CodeBlock
                code={`"Create a new file called docs/guide.md with a user guide, then commit it"`}
              />
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Searching:
              </Typography>
              <CodeBlock
                code={`"Search for all PDF files in the vault and list them"`}
              />
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Data extraction:
              </Typography>
              <CodeBlock
                code={`"Extract ETIM product data from all datasheets in the products folder"`}
              />
            </TabPanel>
          </CardContent>
        </Card>
      )}
      
      {/* Endpoints Reference */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <LinkIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            API Endpoints
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary={<code>POST /mcp/{"{space_id}"}</code>}
                secondary="JSON-RPC over HTTP"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={<code>WS /mcp/{"{space_id}"}/ws</code>}
                secondary="WebSocket for bidirectional MCP"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={<code>GET /mcp/{"{space_id}"}/info</code>}
                secondary="Server info and capabilities"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
