/**
 * PROJEKT GENESIS Sprint 5: Docs Viewer
 * GitBook-style documentation viewer component
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  Divider,
  Breadcrumbs,
  Link,
  Skeleton,
  Alert,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  Search as SearchIcon,
  Menu as MenuIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Edit as EditIcon,
  DarkMode as DarkIcon,
  LightMode as LightIcon,
  TableOfContents as TocIcon
} from "@mui/icons-material";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:9506";

// Sidebar width
const SIDEBAR_WIDTH = 280;
const TOC_WIDTH = 200;

// Navigation Component
function DocsSidebar({ navigation, currentPath, onNavigate }) {
  const renderNavItem = (item, depth = 0) => (
    <React.Fragment key={item.path}>
      <ListItem disablePadding sx={{ pl: depth * 2 }}>
        <ListItemButton
          selected={currentPath === item.path}
          onClick={() => onNavigate(item.path)}
          sx={{ borderRadius: 1 }}
        >
          <ListItemText
            primary={item.title}
            primaryTypographyProps={{
              fontSize: depth === 0 ? "0.95rem" : "0.875rem",
              fontWeight: depth === 0 ? 500 : 400
            }}
          />
        </ListItemButton>
      </ListItem>
      {item.children?.map((child) => renderNavItem(child, depth + 1))}
    </React.Fragment>
  );

  return (
    <List dense sx={{ px: 1 }}>
      {navigation.map((item) => renderNavItem(item))}
    </List>
  );
}

// Table of Contents Component
function TableOfContents({ toc, activeHeading }) {
  if (!toc?.length) return null;

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        On this page
      </Typography>
      {toc.map((item) => (
        <Link
          key={item.slug}
          href={`#${item.slug}`}
          underline="none"
          sx={{
            display: "block",
            py: 0.5,
            pl: (item.level - 1) * 2,
            fontSize: "0.8rem",
            color: activeHeading === item.slug ? "primary.main" : "text.secondary",
            borderLeft: activeHeading === item.slug ? "2px solid" : "none",
            borderColor: "primary.main",
            "&:hover": { color: "primary.main" }
          }}
        >
          {item.title}
        </Link>
      ))}
    </Box>
  );
}

// Search Component
function DocsSearch({ spaceId, branch, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/docs/search/${spaceId}/${branch}?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, spaceId, branch]);

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search docs..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          )
        }}
      />
      {results.length > 0 && (
        <Paper sx={{ mt: 1, maxHeight: 300, overflow: "auto" }}>
          <List dense>
            {results.map((result) => (
              <ListItemButton
                key={result.path}
                onClick={() => {
                  onSelect(result.path);
                  setQuery("");
                  setResults([]);
                }}
              >
                <ListItemText
                  primary={result.title}
                  secondary={result.snippet}
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}

// Main Docs Viewer Component
export default function DocsViewer({ spaceId, branch = "main", config }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [build, setBuild] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [tocOpen, setTocOpen] = useState(true);
  const [activeHeading, setActiveHeading] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Load build
  useEffect(() => {
    async function loadBuild() {
      setLoading(true);
      try {
        // First try to get cached build
        let res = await fetch(`${API_BASE}/docs/build/${spaceId}/${branch}`);
        
        if (!res.ok) {
          // Build it
          res = await fetch(`${API_BASE}/docs/build`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ space_id: spaceId, branch })
          });
        }

        if (res.ok) {
          // Get the build
          res = await fetch(`${API_BASE}/docs/build/${spaceId}/${branch}`);
          const data = await res.json();
          setBuild(data);
          
          // Load first page
          if (data.pages?.length > 0) {
            setCurrentPage(data.pages[0]);
          }
        } else {
          throw new Error("Failed to build docs");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadBuild();
  }, [spaceId, branch]);

  // Navigate to page
  const navigateTo = useCallback((path) => {
    if (!build) return;
    const page = build.pages.find((p) => p.path === path);
    if (page) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
      if (isMobile) setSidebarOpen(false);
    }
  }, [build, isMobile]);

  // Track active heading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    document.querySelectorAll("h1[id], h2[id], h3[id]").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [currentPage]);

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: darkMode ? "#1a1a2e" : "#fff" }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            bgcolor: darkMode ? "#16213e" : "#f8fafc"
          }
        }}
      >
        {/* Logo/Title */}
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6" fontWeight={600}>
            {config?.title || "Documentation"}
          </Typography>
        </Box>

        {/* Search */}
        <DocsSearch spaceId={spaceId} branch={branch} onSelect={navigateTo} />

        <Divider />

        {/* Navigation */}
        {build && (
          <DocsSidebar
            navigation={build.navigation}
            currentPath={currentPage?.path}
            onNavigate={navigateTo}
          />
        )}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          ml: sidebarOpen && !isMobile ? `${SIDEBAR_WIDTH}px` : 0,
          maxWidth: 800,
          mx: "auto"
        }}
      >
        {/* Toolbar */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          {isMobile && (
            <IconButton onClick={() => setSidebarOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          
          <IconButton onClick={() => setTocOpen(!tocOpen)} sx={{ mr: 1 }}>
            <TocIcon />
          </IconButton>
          <IconButton onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <LightIcon /> : <DarkIcon />}
          </IconButton>
        </Box>

        {/* Breadcrumbs */}
        {currentPage && (
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link href="#" underline="hover" color="inherit">
              Docs
            </Link>
            <Typography color="text.primary">{currentPage.title}</Typography>
          </Breadcrumbs>
        )}

        {/* Page Content */}
        {currentPage && (
          <Box
            sx={{
              "& h1": { fontSize: "2rem", fontWeight: 700, mt: 0, mb: 2 },
              "& h2": { fontSize: "1.5rem", fontWeight: 600, mt: 4, mb: 2 },
              "& h3": { fontSize: "1.25rem", fontWeight: 600, mt: 3, mb: 1 },
              "& p": { mb: 2, lineHeight: 1.7 },
              "& pre": {
                bgcolor: "#1e1e1e",
                color: "#d4d4d4",
                p: 2,
                borderRadius: 2,
                overflow: "auto"
              },
              "& code": { fontFamily: "'Fira Code', monospace", fontSize: "0.9em" },
              "& a": { color: "primary.main" },
              "& ul, & ol": { mb: 2, pl: 3 },
              "& li": { mb: 0.5 },
              "& blockquote": {
                borderLeft: "4px solid",
                borderColor: "primary.main",
                pl: 2,
                ml: 0,
                color: "text.secondary"
              },
              "& .admonition": {
                p: 2,
                borderRadius: 2,
                mb: 2,
                display: "flex",
                gap: 2
              },
              "& .admonition-note": { bgcolor: "#e3f2fd" },
              "& .admonition-warning": { bgcolor: "#fff3e0" },
              "& .admonition-tip": { bgcolor: "#e8f5e9" },
              "& .admonition-danger": { bgcolor: "#ffebee" }
            }}
            dangerouslySetInnerHTML={{ __html: currentPage.html }}
          />
        )}

        {/* Prev/Next Navigation */}
        {currentPage && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 6, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
            {currentPage.prev_page ? (
              <Link
                component="button"
                onClick={() => navigateTo(currentPage.prev_page.path)}
                sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
              >
                <PrevIcon sx={{ mr: 0.5 }} />
                {currentPage.prev_page.title}
              </Link>
            ) : <Box />}
            
            {currentPage.next_page ? (
              <Link
                component="button"
                onClick={() => navigateTo(currentPage.next_page.path)}
                sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
              >
                {currentPage.next_page.title}
                <NextIcon sx={{ ml: 0.5 }} />
              </Link>
            ) : <Box />}
          </Box>
        )}

        {/* Edit Link */}
        {currentPage?.edit_url && (
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Link href={currentPage.edit_url} target="_blank" sx={{ display: "inline-flex", alignItems: "center", fontSize: "0.875rem" }}>
              <EditIcon sx={{ mr: 0.5, fontSize: "1rem" }} />
              Edit this page
            </Link>
          </Box>
        )}
      </Box>

      {/* TOC Sidebar */}
      {!isMobile && tocOpen && currentPage?.toc?.length > 0 && (
        <Box
          sx={{
            width: TOC_WIDTH,
            flexShrink: 0,
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "auto",
            borderLeft: "1px solid",
            borderColor: "divider"
          }}
        >
          <TableOfContents toc={currentPage.toc} activeHeading={activeHeading} />
        </Box>
      )}
    </Box>
  );
}
