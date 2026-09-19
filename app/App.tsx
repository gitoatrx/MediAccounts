import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
// Ask for camera/photo access; if Android won't show the prompt again, offer to open app settings.
async function requestBillMediaPermission(source: "camera" | "gallery") {
  const request = source === "camera" ? ImagePicker.requestCameraPermissionsAsync : ImagePicker.requestMediaLibraryPermissionsAsync;
  const permission = await request();
  if (permission.granted) return true;
  const label = source === "camera" ? "camera" : "photo library";
  if (!permission.canAskAgain) {
    Alert.alert(`Allow ${label} access`, `MediAccounts needs ${label} access to add a bill. Turn it on in Settings.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: () => void Linking.openSettings() },
    ]);
  }
  return false;
}
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ActivityIndicator,
  StatusBar as NativeStatusBar,
  Alert,
  Animated,
  Easing,
  Image,
  Keyboard,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Text, TextInput } from "./src/Text";
import { svgFont } from "./src/typography";
import { addBackListener } from "./src/backStack";
import { useIosInsets } from "./src/safeArea";
import { Fragment, type ComponentProps, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Building2,
  Camera,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CloudUpload,
  Download,
  Eye,
  FileCheck,
  FileText,
  FileWarning,
  Folder,
  Home as HomeIcon,
  Pencil,
  Trash,
  ImagePlus,
  Plus,
  RefreshCw,
  Vibrate,
  Sparkles,
  Landmark,
  Star,
  WalletCards,
  BriefcaseBusiness,
  CreditCard,
  PiggyBank,
  Users,
  Check,
  ArrowLeft,
  Image as ImageIcon,
  Images,
  List,
  LogOut,
  Mail,
  MoreHorizontal,
  ReceiptText,
  Search,
  Tag,
  Upload,
  UserRound,
  UsersRound, ImageOff
} from "lucide-react-native";
import Svg, { Circle as SvgCircle, ClipPath, Defs, G, RadialGradient as SvgRadialGradient, Line as SvgLine, LinearGradient as SvgLinearGradient, Path, Rect as SvgRect, Stop, Text as SvgText } from "react-native-svg";
import { BankIcon, MastercardIcon, VisaIcon } from "./src/InstitutionIcons";
import { ApiRequestError, attachExistingBill, AuthSession, AvailableBill, billFileUrl, createBankAccount, createBusiness, createTransaction, createUser, CsvImportResult, downloadBillPreview, businessLogoUrl, deleteBusinessLogo, uploadBusinessLogo, uploadUserAvatar, userAvatarUrl, FinanceTransaction, GalleryBill, getBillGallery, BusinessDetails, deleteBankAccount, deleteBusiness, getAddressDetails, getAvailableBills, getBusiness, getCategories, updateBankAccount, updateBusiness, getBusinessAccounts, getCurrentSession, getUsers, getProfile, getWorkspace, AddressSuggestion, importTransactionsCsv, logoutSession, searchAddresses, ManagedUser, requestLoginCode, signInWithGoogle, transactionBillFileUrl, updateProfile, updateTransaction, updateUser, updateUserBusinesses, uploadBill, uploadStandaloneBill, verifyLoginCode, Workspace } from "./src/api";
import { firebaseIdTokenFromGoogle, signInWithFirebaseToken, signOutFirebase } from "./src/firebase";
import { getGoogleIdToken, googleSignInErrorMessage, signOutGoogle } from "./src/googleAuth";
import { clearSession, readSession, saveSession } from "./src/sessionStore";
import { UI_SCALE } from "./src/ScaledRoot";
import { useShake } from "./src/useShake";
import { useKeyboardScroll } from "./src/useKeyboardScroll";
import { useBackHandler } from "./src/useBackHandler";
import { haptic, useMessageHaptic } from "./src/haptics";
import { Bone, Skeleton, BillCardsSkeleton, DetailsSkeleton, FieldSkeleton, ImageSkeleton, SheetRowsSkeleton, SkeletonRows, TextSkeleton, BillOptionsSkeleton, BillsSkeleton, CardListSkeleton, ChartsSkeleton, FormSkeleton, HomeSkeleton, TransactionsSkeleton, usePullRefresh } from "./src/Skeleton";

// Shared brand asset used for the login flow, onboarding headers, and compact app chrome.
// Keeping one source of truth prevents the old placeholder mark from resurfacing on another screen.
const BRAND_LOGO = require("./assets/mediaccounts-logo.png");

// The HTML reference uses fixed CSS typography. Keep native screens visually
// consistent on Android devices that have a larger system font setting.
(RNText as any).defaultProps = { ...((RNText as any).defaultProps || {}), allowFontScaling: false, maxFontSizeMultiplier: 1 };
(RNTextInput as any).defaultProps = { ...((RNTextInput as any).defaultProps || {}), allowFontScaling: false, maxFontSizeMultiplier: 1 };

// The signed-in token, for components that only display protected images (e.g. business logos).
const sessionTokenStore = { current: "" };

export default function App() {
  const [page, setPage] = useState("login");
  // On iPhone the top gap grows to clear the status bar / Dynamic Island; Android keeps 52.
  const iosInsets = useIosInsets();
  const appTop = iosInsets.top ? { paddingTop: Math.max(52, iosInsets.top + 8) } : null;
  // True while a saved session is checked at launch, so the sign-in screen never flashes.
  const [restoring, setRestoring] = useState(true);
  // Animated logo shown once per launch before the sign-in page (not for signed-in users).
  const [introDone, setIntroDone] = useState(false);
  // A saved session was found at launch: show Home placeholders while it is checked.
  const [restoringSession, setRestoringSession] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
  const [codeSending, setCodeSending] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  sessionTokenStore.current = sessionToken ?? "";
  const [authBusinesses, setAuthBusinesses] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [currentUser, setCurrentUser] = useState<AuthSession['user'] | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceError, setWorkspaceError] = useState("");
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [homeNotice, setHomeNotice] = useState("");
  // Notices clear themselves, except while an upload is still running.
  useAutoClear(!!homeNotice && !homeNotice.endsWith("…"), homeNotice, () => setHomeNotice(""));
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  // Picking a bank shows the loading placeholders for a moment, then that bank's data.
  const [bankSwitching, setBankSwitching] = useState(false);
  const bankSwitchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (bankSwitchTimer.current) clearTimeout(bankSwitchTimer.current); }, []);
  const chooseBank = (bankId: string) => {
    setSelectedBankId(bankId);
    setBankSwitching(true);
    if (bankSwitchTimer.current) clearTimeout(bankSwitchTimer.current);
    bankSwitchTimer.current = setTimeout(() => setBankSwitching(false), 600);
  };
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'This month' | 'Last month' | 'This quarter' | 'Year to date'>('This month');
  const [businesses, setBusinesses] = useState(false);
  const [bankSheet, setBankSheet] = useState(false);
  const [periodSheet, setPeriodSheet] = useState(false);
  const [uploadSheet, setUploadSheet] = useState(false);
  const [csvSheet, setCsvSheet] = useState(false);
  const [pendingBillFile, setPendingBillFile] = useState<{ uri: string; name: string; mimeType?: string | null } | null>(null);
  const [flow, setFlow] = useState("");
  // Long-press menu on a transaction row.
  const [rowMenu, setRowMenu] = useState<FinanceTransaction | null>(null);
  const [openCategoryOnDetails, setOpenCategoryOnDetails] = useState(false);
  // Business shown in the bill gallery (Home's business unless opened after an upload).
  const [galleryBusinessId, setGalleryBusinessId] = useState("");
  const loadWorkspace = async (token: string, businessId?: string) => {
    setWorkspaceError("");
    setWorkspaceLoading(true);
    // Switching business shows the loader instead of the previous business's data.
    const switching = !!businessId && businessId !== workspace?.activeBusiness?.id;
    if (switching) setWorkspace(null);
    const startedAt = Date.now();
    try {
      const data = await getWorkspace(token, businessId);
      // Keep the loading placeholders up briefly when switching, so the change is visible.
      if (switching) await new Promise((resolve) => setTimeout(resolve, Math.max(0, 600 - (Date.now() - startedAt))));
      setWorkspace(data);
      setSelectedBankId((current) => data.bankAccounts.some((account) => account.id === current) ? current : data.bankAccounts[0]?.id ?? null);
      return true;
    }
    catch (error) { setWorkspaceError(error instanceof Error ? error.message : "Unable to load your business data."); return false; }
    finally { setWorkspaceLoading(false); }
  };
  useEffect(() => {
    void (async () => {
      const token = await readSession().catch(() => null);
      if (!token) { setRestoring(false); return; }
      setRestoringSession(true);
      try {
        const session = await getCurrentSession(token);
        setSessionToken(token);
        setAuthBusinesses(session.businesses);
        setCurrentUser(session.user);
        if (session.businesses.length) void loadWorkspace(token);
        setPage(session.businesses.length ? "home" : "empty");
      } catch { await clearSession().catch(() => undefined); }
      finally { setRestoring(false); }
    })();
  }, []);
  const [quickActionsOpen, setQuickActionsOpen] = useState<"" | "shake" | "menu">("");
  const [transactionFilterSignal, setTransactionFilterSignal] = useState(0);
  const [toast, setToast] = useState("");
  // Shake only on the main tabs of a signed-in session, never on sign-in or while filling a form.
  const shakeEnabled = !!sessionToken && !restoring && !quickActionsOpen && ["home", "upload", "transactions", "more", "charts", "reports"].includes(page);
  useShake(shakeEnabled, () => { Keyboard.dismiss(); setQuickActionsOpen("shake"); });
  useEffect(() => {
    if (!toast || toast.endsWith("…")) return;
    haptic.success();
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (page === "login") Keyboard.dismiss();
  }, [page]);
  useMessageHaptic(authError, true);
  useMessageHaptic(workspaceError, true);
  // Staff never see the Users pages (admin only).
  useEffect(() => {
    if ((page === "team" || page === "addUser") && currentUser && currentUser.role !== "admin") setPage("more");
  }, [page, currentUser]);
  // Android back button / back swipe: close what is open, then go to the previous screen.
  // Only Home, sign-in and the empty state leave the app.
  const previousPage = useRef("home");
  const currentPage = useRef(page);
  if (currentPage.current !== page) { previousPage.current = currentPage.current; currentPage.current = page; }
  const backState = useRef({ rowMenu, page, quickActionsOpen, businesses, bankSheet, periodSheet, uploadSheet, csvSheet, selectedTransactionId, hasBusinesses: authBusinesses.length > 0 });
  backState.current = { rowMenu, page, quickActionsOpen, businesses, bankSheet, periodSheet, uploadSheet, csvSheet, selectedTransactionId, hasBusinesses: authBusinesses.length > 0 };
  useEffect(() => {
    const parents: Record<string, string> = {
      details: "transactions", team: "more", addUser: "team", profile: "more", businesses: "more",
      addInstitution: "home", newtransaction: "transactions", gallery: "transactions", upload: "home", transactions: "home",
      receipts: "home", more: "home", charts: "more", reports: "more", code: "login",
    };
    const subscription = addBackListener(() => {
      const state = backState.current;
      if (state.rowMenu) { setRowMenu(null); return true; }
      if (state.quickActionsOpen) { setQuickActionsOpen(""); return true; }
      if (state.businesses) { setBusinesses(false); return true; }
      if (state.bankSheet) { setBankSheet(false); return true; }
      if (state.periodSheet) { setPeriodSheet(false); return true; }
      if (state.uploadSheet) { setUploadSheet(false); return true; }
      if (state.csvSheet) { setCsvSheet(false); return true; }
      if (state.page === "gallery") { setPage(previousPage.current === "upload" ? "upload" : "transactions"); return true; }
      if (state.page === "uploadBill") { setPage(state.selectedTransactionId ? "details" : "home"); return true; }
      if (state.page === "newbiz") {
        const back = previousPage.current;
        setPage(state.hasBusinesses ? (["businesses", "home", "more"].includes(back) ? back : "home") : "empty");
        return true;
      }
      const parent = parents[state.page];
      if (parent) { if (state.page === "code") { setAuthError(""); setAuthNotice(""); } setPage(parent); return true; }
      return false;
    });
    return () => subscription.remove();
  }, []);

  // Requests a fresh code for the given address and makes it the active email on the code screen.
  const requestCodeFor = async (targetEmail: string) => {
    const result = await requestLoginCode(targetEmail);
    setEmail(result.email ?? targetEmail);
    // Without SMTP (local testing) the backend returns the code so it can be prefilled.
    setCode(result.devCode ?? "");
    setResendAvailableAt(Date.now() + (result.resendAfterSeconds ?? 30) * 1000);
    return result;
  };

  // A 429 means a code for that address was sent moments ago and is still valid.
  const cooldownSeconds = (error: unknown) =>
    error instanceof ApiRequestError && error.status === 429 ? Number(error.data.retryAfterSeconds) || 30 : 0;

  const sendCode = async () => {
    setAuthError("");
    setAuthNotice("");
    const target = normalizeEmailInput(email);
    if (!isEmailAddress(target)) { setAuthError("Enter a valid email address."); return; }
    setAuthBusy(true);
    try {
      const result = await requestCodeFor(target);
      Keyboard.dismiss();
      setAuthNotice(`Code sent. It expires in ${result.expiresInMinutes} minutes.`);
      setPage("code");
    } catch (error) {
      const wait = cooldownSeconds(error);
      if (wait) {
        setEmail(target);
        setCode("");
        setResendAvailableAt(Date.now() + wait * 1000);
        setAuthNotice("We already sent a code to this email. Enter it below or resend shortly.");
        Keyboard.dismiss();
        setPage("code");
      } else setAuthError(error instanceof Error ? error.message : "Unable to send a code.");
    } finally { setAuthBusy(false); }
  };

  const resendCode = async () => {
    setAuthError("");
    setAuthNotice("");
    setCodeSending(true);
    try {
      const result = await requestCodeFor(email);
      setAuthNotice(`A new code was sent to ${result.email}. Earlier codes no longer work.`);
    } catch (error) {
      const wait = cooldownSeconds(error);
      if (wait) setResendAvailableAt(Date.now() + wait * 1000);
      setAuthError(error instanceof Error ? error.message : "Unable to resend the code.");
    } finally { setCodeSending(false); }
  };

  const changeCodeEmail = async (nextEmail: string) => {
    setAuthError("");
    setAuthNotice("");
    const target = normalizeEmailInput(nextEmail);
    if (!isEmailAddress(target)) { setAuthError("Enter a valid email address."); return false; }
    if (target === normalizeEmailInput(email)) { setAuthError("That is the email we already sent the code to."); return false; }
    setCodeSending(true);
    try {
      const result = await requestCodeFor(target);
      setAuthNotice(`Code sent to ${result.email}. It expires in ${result.expiresInMinutes} minutes.`);
      return true;
    } catch (error) {
      const wait = cooldownSeconds(error);
      if (wait) {
        setEmail(target);
        setCode("");
        setResendAvailableAt(Date.now() + wait * 1000);
        setAuthNotice(`A code was already sent to ${target}. Enter it below or resend shortly.`);
        return true;
      }
      setAuthError(error instanceof Error ? error.message : "Unable to send a code to that email.");
      return false;
    } finally { setCodeSending(false); }
  };

  // Open the app as soon as the backend accepts the sign-in. Saving the session and
  // loading business data continue in the background while Home shows a loading state.
  const finishSignIn = (session: AuthSession) => {
    Keyboard.dismiss();
    setSessionToken(session.token);
    setAuthBusinesses(session.businesses);
    setCurrentUser(session.user);
    setWorkspace(null);
    setPage(session.businesses.length ? "home" : "empty");
    void saveSession(session.token).catch(() => undefined);
    if (session.businesses.length) void loadWorkspace(session.token);
  };

  const confirmCode = async () => {
    setAuthError("");
    if (code.length !== 6) { setAuthError("Enter the 6-digit verification code."); return; }
    setAuthBusy(true);
    try {
      const session = await verifyLoginCode(email, code);
      finishSignIn(session);
      // Firebase is optional for the API, so its Google round trip must not delay Home.
      if (session.firebaseToken) void signInWithFirebaseToken(session.firebaseToken);
    } catch (error) { setAuthError(error instanceof Error ? error.message : "Unable to verify the code."); }
    finally { setAuthBusy(false); }
  };

  const continueWithGoogle = async () => {
    setAuthError("");
    Keyboard.dismiss();
    setAuthBusy(true);
    setGoogleBusy(true);
    try {
      const googleIdToken = await getGoogleIdToken();
      if (!googleIdToken) return;
      // The backend verifies the Google token directly, so login doesn't wait on Firebase.
      finishSignIn(await signInWithGoogle(googleIdToken));
      void firebaseIdTokenFromGoogle(googleIdToken).catch((error) => console.warn('Firebase Google sign-in skipped:', error));
    } catch (error) {
      console.warn('Google sign-in failed:', error);
      // Leave no half-signed-in Google/Firebase state behind, e.g. for an email without access.
      await signOutFirebase().catch(() => undefined);
      await signOutGoogle().catch(() => undefined);
      setAuthError(googleSignInErrorMessage(error));
    } finally {
      setAuthBusy(false);
      setGoogleBusy(false);
    }
  };

  const signOut = async () => {
    await signOutFirebase().catch(() => undefined);
    if (sessionToken) await logoutSession(sessionToken).catch(() => undefined);
    await signOutGoogle().catch(() => undefined);
    await clearSession().catch(() => undefined);
    setSessionToken(null);
    setAuthBusinesses([]);
    setCurrentUser(null);
    setWorkspace(null);
    setCode("");
    setAuthError("");
    setPage("login");
  };
  // AI reads a bill a few seconds after upload; refresh quietly so an automatic match shows up.
  const refreshTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => refreshTimers.current.forEach(clearTimeout), []);
  const refreshAfterBillUpload = (businessId: string) => {
    refreshTimers.current.forEach(clearTimeout);
    refreshTimers.current = [6000, 15000, 30000].map((delay) => setTimeout(() => {
      if (sessionTokenRef.current && activeBusinessRef.current === businessId) void loadWorkspace(sessionTokenRef.current, businessId);
    }, delay));
  };
  const sessionTokenRef = useRef(sessionToken);
  sessionTokenRef.current = sessionToken;
  const activeBusinessRef = useRef(workspace?.activeBusiness?.id);
  activeBusinessRef.current = workspace?.activeBusiness?.id;
  const saveStandaloneBill = async (file: { uri: string; name: string; mimeType?: string | null }) => {
    if (!sessionToken || !workspace?.activeBusiness) return;
    if (!selectedBankId) { setUploadSheet(false); haptic.error(); setHomeNotice('Add or select a bank account before uploading bills.'); return; }
    setUploadSheet(false); setHomeNotice('Uploading bill…');
    try { const saved = await uploadStandaloneBill(sessionToken, { businessId: workspace.activeBusiness.id, bankAccountId: selectedBankId, file }); await loadWorkspace(sessionToken, workspace.activeBusiness.id); if (saved.aiReading) refreshAfterBillUpload(workspace.activeBusiness.id); haptic.success(); setHomeNotice(saved.aiReading ? 'Bill uploaded. It will be attached automatically to the matching transaction.' : 'Bill uploaded for this business. Attach it from a transaction when ready.'); }
    catch (error) { haptic.error(); setHomeNotice(error instanceof Error ? error.message : 'Unable to upload the bill.'); }
  };
  const chooseBillMedia = async (source: 'camera' | 'gallery') => {
    if (!(await requestBillMediaPermission(source))) { setAuthError(`Allow ${source === 'camera' ? 'camera' : 'photo library'} access to upload a bill.`); return; }
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled) { const asset = result.assets[0]; await saveStandaloneBill({ uri: asset.uri, name: asset.fileName ?? `bill-${Date.now()}.jpg`, mimeType: asset.mimeType ?? 'image/jpeg' }); }
  };
  const chooseBillFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png'], copyToCacheDirectory: true });
    if (!result.canceled) { const asset = result.assets[0]; await saveStandaloneBill({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType }); }
  };
  const runQuickAction = async (action: QuickAction) => {
    setQuickActionsOpen("");
    if (action === "upload") setPage("upload");
    else if (action === "csv") { setPage("home"); setCsvSheet(true); }
    else if (action === "search") { setPage("transactions"); setTransactionFilterSignal((value) => value + 1); }
    else if (action === "charts") setPage("charts");
  };
  // Home bank picker: set any account as the business's primary account.
  const makeBankPrimary = async (account: Workspace['bankAccounts'][number], primary: boolean) => {
    const businessId = workspace?.activeBusiness?.id;
    if (!sessionToken || !businessId) return;
    await updateBankAccount(sessionToken, businessId, account.id, { name: account.name, accountType: account.accountType, isPrimary: primary });
    await loadWorkspace(sessionToken, businessId);
    setToast(primary ? `${account.name} is now the primary account` : `${account.name} is no longer primary`);
  };
  const exportTransactions = async () => {
    const business = workspace?.activeBusiness;
    const rows = transactionsForPeriod((workspace?.transactions ?? []).filter((item) => !selectedBankId || item.bankAccountId === selectedBankId), selectedPeriod);
    if (!business) { setHomeNotice("Select a business before exporting."); return; }
    if (!rows.length) { setHomeNotice(`No transactions to export for ${selectedPeriod.toLowerCase()}.`); return; }
    try {
      if (!(await Sharing.isAvailableAsync())) { setHomeNotice("Sharing is not available on this device."); return; }
      const bank = workspace?.bankAccounts.find((account) => account.id === selectedBankId);
      const file = new File(Paths.cache, `${business.slug}-${selectedPeriod.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`);
      file.create({ overwrite: true, intermediates: true });
      file.write(transactionsCsv(rows));
      setHomeNotice("");
      await Sharing.shareAsync(file.uri, { mimeType: "text/csv", dialogTitle: `Export ${business.name}${bank ? ` · ${bank.name}` : ""} transactions`, UTI: "public.comma-separated-values-text" });
    } catch (error) {
      haptic.error();
      setHomeNotice(error instanceof Error ? error.message : "Unable to export transactions.");
    }
  };
  const dataLoading = (workspaceLoading && !workspace) || bankSwitching;
  // Pull-down refresh on the main screens reloads the active business.
  const refreshWorkspace = sessionToken ? async () => { await loadWorkspace(sessionToken, workspace?.activeBusiness?.id); } : undefined;
  const openDetails = (id: string, category = false) => { setOpenCategoryOnDetails(category); setSelectedTransactionId(id); setPage("details"); };
  // Display only: the intro plays while the saved sign-in is checked and before the sign-in page;
  // a signed-in user goes straight to the Home placeholder as before.
  // Same shape as the sign-in return below, so the intro and the page stay mounted across the switch.
  if (!introDone && restoring && !restoringSession) return <View style={introUi.host}>{null}<LaunchIntro onDone={() => setIntroDone(true)} /></View>;
  if (restoring) return restoringSession
    ? <View style={[s.app, appTop]}><StatusBar style="dark" /><HomeSkeleton /></View>
    : <PageLoader dark label="Opening MediAccounts…" />;
  if (page === "details")
    return (
      <View style={[s.app, appTop]}>
        <StatusBar style="dark" />
        {dataLoading ? <DetailsSkeleton /> : <OpeningPlaceholder key={selectedTransactionId ?? "details"} duration={800} placeholder={<DetailsSkeleton />}><TransactionDetails openCategory={openCategoryOnDetails} onCategoryOpened={() => setOpenCategoryOnDetails(false)} transaction={workspace?.transactions.find((item) => item.id === selectedTransactionId) ?? workspace?.transactions[0]} token={sessionToken ?? ""} onChanged={() => sessionToken && void loadWorkspace(sessionToken)} onBack={() => setPage("transactions")} /></OpeningPlaceholder>}
        <Nav page="transactions" setPage={setPage} />
      </View>
    );
  if (page === "gallery")
    return (
      <View style={[s.app, appTop]}>
        <StatusBar style="dark" />
        <BillGallery token={sessionToken ?? ""} business={(workspace?.businesses ?? authBusinesses).find((item) => item.id === galleryBusinessId) ?? workspace?.activeBusiness ?? null} onBack={() => setPage(previousPage.current === "upload" ? "upload" : "transactions")} onOpenTransaction={(id) => openDetails(id)} />
        <Nav page="transactions" setPage={setPage} />
      </View>
    );
  if (page === "uploadBill")
    return (
      <View style={[s.app, appTop]}>
        <StatusBar style="dark" />
        {dataLoading ? <DetailsSkeleton /> : <UploadBill token={sessionToken ?? ""} workspace={workspace} transactions={(workspace?.transactions ?? []).filter((item) => !selectedBankId || item.bankAccountId === selectedBankId)} selectedBankId={selectedBankId} preferredTransactionId={selectedTransactionId} initialFile={pendingBillFile} onChooseMedia={chooseBillMedia} onSaved={(matchedTransactionId) => { haptic.success(); setPendingBillFile(null); setSelectedTransactionId(matchedTransactionId); if (sessionToken) void loadWorkspace(sessionToken, workspace?.activeBusiness?.id); setPage("details"); }} onBack={() => setPage(selectedTransactionId ? "details" : "home")} />}
        <Nav page="home" setPage={setPage} />
      </View>
    );
  if (page === "team")
    return (
      <View style={[s.app, appTop]}>
        <StatusBar style="dark" />
        <Team token={sessionToken ?? ""} businesses={workspace?.businesses ?? authBusinesses} onBack={() => setPage("more")} onAdd={() => setPage("addUser")} />
        <Nav page="more" setPage={setPage} />
      </View>
    );
  if (page === "addUser")
    return (
      <View style={[s.app, appTop]}>
        <StatusBar style="dark" />
        <AddUser token={sessionToken ?? ""} businesses={authBusinesses} onBack={() => setPage("team")} onSaved={() => { haptic.success(); setPage("team"); }} />
        <Nav page="more" setPage={setPage} />
      </View>
    );
  if (page === "profile")
    return <View style={[s.app, appTop]}><StatusBar style="dark" /><ProfilePage token={sessionToken ?? ''} user={currentUser} onUpdated={(user) => setCurrentUser(user)} onBack={() => setPage("more")} /><Nav page="more" setPage={setPage} /></View>;
  if (page === "businesses")
    return <View style={[s.app, appTop]}><StatusBar style="dark" /><BusinessesPage canManage switching={dataLoading} onChanged={(deletedBusinessId) => { if (sessionToken) void loadWorkspace(sessionToken, workspace?.activeBusiness?.id === deletedBusinessId ? undefined : workspace?.activeBusiness?.id); }} token={sessionToken ?? ""} workspace={workspace} businesses={workspace?.businesses ?? authBusinesses} onSelect={(businessId) => { if (sessionToken) void loadWorkspace(sessionToken, businessId); }} onBack={() => setPage("more")} onAdd={() => setPage("newbiz")} /><Nav page="more" setPage={setPage} /></View>;
  if (page === "addInstitution")
    return <View style={[s.app, appTop]}><StatusBar style="dark" /><AddInstitution token={sessionToken ?? ''} business={workspace?.activeBusiness ?? null} footerOffset={124} onBack={() => setPage('home')} onSaved={async () => { haptic.success(); if (sessionToken) await loadWorkspace(sessionToken, workspace?.activeBusiness?.id); setPage('home'); }} /><Nav page="home" setPage={setPage} /></View>;
  if (page === "code")
    return (
      <Otp
        email={email}
        code={code}
        onCodeChange={(value) => { setCode(value); if (authError) setAuthError(""); }}
        busy={authBusy}
        sending={codeSending}
        error={authError}
        notice={authNotice}
        resendAvailableAt={resendAvailableAt}
        onBack={() => { setAuthError(""); setAuthNotice(""); setPage("login"); }}
        onNext={confirmCode}
        onResend={resendCode}
        onChangeEmail={changeCodeEmail}
      />
    );
  if (page === "empty")
    return (
      <WelcomeSetup
        onAdd={() => setPage("newbiz")}
        onLogout={signOut}
      />
    );
  if (page === "newbiz")
    return (
      <NewBusiness
        onBack={() => setPage(authBusinesses.length ? (["businesses", "home", "more"].includes(previousPage.current) ? previousPage.current : "home") : "empty")}
        token={sessionToken ?? ""}
        onCreate={async (business) => { haptic.success(); setAuthBusinesses((items) => items.some((item) => item.id === business.id) ? items : [...items, business]); if (sessionToken) await loadWorkspace(sessionToken, business.id); setPage("home"); }}
      />
    );
  if (page === "newtransaction")
    return <><StatusBar style="dark" /><NewTransaction token={sessionToken ?? ""} workspace={workspace} onBack={() => setPage("transactions")} onCreated={() => { haptic.success(); if (sessionToken) void loadWorkspace(sessionToken, workspace?.activeBusiness?.id); setPage("transactions"); }} /></>;
  if (page === "login")
    return (
      <View style={introUi.host}>
      <Auth
        onGoogle={continueWithGoogle}
        googleBusy={googleBusy}
        email={email}
        onEmailChange={setEmail}
        busy={authBusy}
        error={authError}
        onEmail={sendCode}
      />
      {!introDone && <LaunchIntro onDone={() => setIntroDone(true)} />}
      </View>
    );
  return (
    <View style={[s.app, appTop]}>
      <StatusBar style="dark" />
      {page === "home" && dataLoading && <HomeSkeleton />}
      {page === "home" && !dataLoading && (
        <OpeningPlaceholder duration={800} placeholder={<HomeSkeleton />}><Dashboard
          workspace={workspace}
          loading={workspaceLoading}
          error={workspaceError}
          notice={homeNotice}
          selectedBankId={selectedBankId}
          selectedPeriod={selectedPeriod}
          onBusiness={() => setBusinesses(true)}
          onBank={() => setBankSheet(true)}
          onPeriod={() => setPeriodSheet(true)}
          onDetails={(id) => openDetails(id)}
          onLongPress={setRowMenu}
          onRefresh={refreshWorkspace}
          onImport={() => setCsvSheet(true)}
          onExport={() => void exportTransactions()}
        /></OpeningPlaceholder>
      )}
      {page === "upload" && (
        <UploadBillPage
          token={sessionToken ?? ""}
          businesses={workspace?.businesses ?? authBusinesses}
          defaultBusinessId={workspace?.activeBusiness?.id ?? ""}
          defaultBankId={selectedBankId}
          onGallery={(businessId) => { setGalleryBusinessId(businessId); setPage("gallery"); }}
          onAccountsChanged={(businessId) => { if (sessionToken && businessId === workspace?.activeBusiness?.id) void loadWorkspace(sessionToken, businessId); }}
          onBack={() => setPage("home")}
          onUploaded={async (businessId) => { haptic.success(); if (sessionToken && businessId === workspace?.activeBusiness?.id) { await loadWorkspace(sessionToken, businessId); refreshAfterBillUpload(businessId); } }}
        />
      )}
      {page === "transactions" && dataLoading && <TransactionsSkeleton />}
      {page === "transactions" && !dataLoading && (
        <AllTransactions filterSignal={transactionFilterSignal} onFilterSignalHandled={() => setTransactionFilterSignal(0)} transactions={(workspace?.transactions ?? []).filter((item) => !selectedBankId || item.bankAccountId === selectedBankId)} onDetails={(id) => openDetails(id)} onLongPress={setRowMenu} onRefresh={refreshWorkspace} onBack={() => setPage("home")} onGallery={() => { setGalleryBusinessId(""); setPage("gallery"); }} />
      )}
      {page === "receipts" && dataLoading && <BillsSkeleton />}
      {page === "receipts" && !dataLoading && <OpeningPlaceholder duration={800} placeholder={<BillsSkeleton />}><Bills transactions={(workspace?.transactions ?? []).filter((item) => !selectedBankId || item.bankAccountId === selectedBankId)} onRefresh={refreshWorkspace} /></OpeningPlaceholder>}
      {page === "charts" && dataLoading && <ChartsSkeleton />}
      {page === "charts" && !dataLoading && <Charts onRefresh={refreshWorkspace} workspace={workspace} selectedBankId={selectedBankId} onBusiness={() => setBusinesses(true)} onBank={() => setBankSheet(true)} onBack={() => setPage("more")} />}
      {page === "reports" && dataLoading && <ChartsSkeleton />}
      {page === "reports" && !dataLoading && <Reports workspace={workspace} selectedBankId={selectedBankId} onBusiness={() => setBusinesses(true)} onBank={() => setBankSheet(true)} onBack={() => setPage("more")} />}
      {page === "more" && (
        // Placeholder rows for a moment when the tab opens, like the other tabs.
        <OpeningPlaceholder duration={800} placeholder={<MoreSkeleton rows={currentUser?.role === "admin" ? 6 : 5} />}>
        <More
          isAdmin={currentUser?.role === "admin"}
          onLogout={signOut}
          onBusinesses={() => setPage("businesses")}
          onTeam={() => setPage("team")}
          onCharts={() => setPage("charts")}
          onReports={() => setPage("reports")}
          onProfile={() => setPage("profile")}
          onShortcuts={() => setQuickActionsOpen("menu")}
        />
        </OpeningPlaceholder>
      )}
      <Nav page={page === "charts" || page === "reports" ? "more" : page} setPage={setPage} />
      {!!quickActionsOpen && <ShakeShortcutsSheet source={quickActionsOpen} onChoose={(action) => void runQuickAction(action)} onClose={() => setQuickActionsOpen("")} />}
      {!!toast && <View pointerEvents="none" style={quickUi.toastWrap}><View style={quickUi.toast}>{toast.endsWith("…") ? <ActivityIndicator size="small" color="#FFF" /> : <RefreshCw size={15} color="#FFF" />}<Text style={quickUi.toastText}>{toast}</Text></View></View>}
      {businesses && (
        <BusinessSheet
          businesses={workspace?.businesses ?? []}
          selectedBusinessId={workspace?.activeBusiness?.id ?? null}
          onClose={() => setBusinesses(false)}
          onChoose={(businessId) => { setBusinesses(false); if (sessionToken) void loadWorkspace(sessionToken, businessId); }}
          onAdd={() => {
            setBusinesses(false);
            setPage("newbiz");
          }}
        />
      )}
      {bankSheet && <BankSheet accounts={workspace?.bankAccounts ?? []} selectedBankId={selectedBankId} onMakePrimary={makeBankPrimary} onChoose={(bankId) => { setBankSheet(false); chooseBank(bankId); }} onAdd={() => { setBankSheet(false); setPage('addInstitution'); }} onClose={() => setBankSheet(false)} />}
      {rowMenu && <TransactionMenu transaction={rowMenu} onClose={() => setRowMenu(null)}
        onDetails={() => { setRowMenu(null); openDetails(rowMenu.id); }}
        onCategory={() => { setRowMenu(null); openDetails(rowMenu.id, true); }}
        onUploadBill={() => { setRowMenu(null); setPendingBillFile(null); setSelectedTransactionId(rowMenu.id); setPage("uploadBill"); }} />}
      {periodSheet && <PeriodSheet selected={selectedPeriod} onChoose={(period) => { setSelectedPeriod(period); setPeriodSheet(false); }} onClose={() => setPeriodSheet(false)} />}
      {uploadSheet && <UploadOptionsSheet onClose={() => setUploadSheet(false)} onCamera={() => void chooseBillMedia('camera')} onGallery={() => void chooseBillMedia('gallery')} />}
      {csvSheet && <CsvUploadSheet token={sessionToken ?? ''} workspace={workspace} selectedBankId={selectedBankId} onClose={() => setCsvSheet(false)} onImported={() => { haptic.success(); setCsvSheet(false); if (sessionToken) void loadWorkspace(sessionToken, workspace?.activeBusiness?.id); }} />}
      {!!flow && (
        <Flow
          name={flow}
          close={() => setFlow("")}
          done={() => {
            if (flow === "team") {
              setFlow("invite");
              return;
            }
            setFlow("");
            setPage(flow === "csv" ? "transactions" : "home");
          }}
        />
      )}
    </View>
  );
}

const tx = [
  ["Meridian Supply Canada", "Sep 2 · Inventory", "-$4,182.60", "#5B6CFF"],
  ["Northline Wholesale Supply", "Sep 1 · Supplies", "-$318.44", "#F28A18"],
  ["BC Hydro", "Aug 31 · Utilities", "-$412.19", "#159148"],
  ["Telus Business", "Aug 30 · Telecom", "-$164.85", "#8058FF"],
  ["Uline Packaging", "Aug 29 · Supplies", "-$256.30", "#F28A18"],
  ["Payroll — Aug period B", "Aug 28 · Payroll", "-$12,940.00", "#3372DB"],
  ["Coastal Marketing Co-op", "Aug 27 · Marketing", "-$540.00", "#D83F6D"],
  ["Vancity Lease Payment", "Aug 26 · Rent", "-$3,850.00", "#74745C"],
  ["Purolator", "Aug 25 · Shipping", "-$88.12", "#1599AA"],
];

const numberValue = (value: string | number) => Number(value ?? 0);
const money = (value: string | number) => {
  const amount = numberValue(value);
  return `$${Math.abs(amount).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

function GoogleIcon({ size = 28 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path fill="#4285F4" d="M21.35 12.23c0-.79-.07-1.55-.2-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.78h3.14c1.84-1.7 2.9-4.2 2.9-7.17 0-.76-.07-1.5-.2-2.2Z"/><Path fill="#34A853" d="M12 21.5c2.64 0 4.86-.88 6.48-2.4l-3.14-2.78c-.87.58-1.98.92-3.34.92-2.55 0-4.7-1.72-5.47-4.03H3.3V16.1A9.78 9.78 0 0 0 12 21.5Z"/><Path fill="#FBBC05" d="M6.53 13.21A5.88 5.88 0 0 1 6.22 12c0-.42.07-.82.2-1.21V7.9H3.3A9.5 9.5 0 0 0 2.5 12c0 1.57.38 3.05.8 4.1l3.23-2.89Z"/><Path fill="#EA4335" d="M12 6.76c1.48 0 2.8.51 3.84 1.5l2.88-2.81C16.86 3.72 14.64 2.5 12 2.5A9.78 9.78 0 0 0 3.3 7.9l3.23 2.89C7.3 8.48 9.45 6.76 12 6.76Z"/></Svg>;
}

function BrandWordmark({ width = 285, height = 46 }: { width?: number; height?: number }) {
  return <Svg width={width} height={height} viewBox="0 0 285 46"><Defs><SvgLinearGradient id="brandWordmark" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#FFFFFF"/><Stop offset="1" stopColor="#8492FF"/></SvgLinearGradient></Defs><SvgText x="142.5" y="35" textAnchor="middle" fontSize="34" {...svgFont(800)} fill="url(#brandWordmark)">MediAccounts</SvgText></Svg>;
}

function BrandMark({ size = 48 }: { size?: number }) {
  return <Image source={BRAND_LOGO} style={{ width: size, height: size, borderRadius: Math.round(size * 0.22) }} resizeMode="cover" accessibilityLabel="MediAccounts logo" />;
}

function SlideUpSheet({ children, style, scrollable = false, onClose }: { children: any; style: any; scrollable?: boolean; onClose?: () => void }) {
  const translateY = useRef(new Animated.Value(460)).current;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const sheetRef = useRef<View>(null);
  const sheetTop = useRef(0);
  // Measured once the sheet has finished sliding up, so the swipe area matches its real top edge.
  const measureTop = () => sheetRef.current?.measureInWindow((_x, y) => { sheetTop.current = y; });
  useEffect(() => {
    Animated.timing(translateY, { toValue: 0, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(measureTop);
  }, [translateY]);
  // Swipe down, starting on the handle/title area, closes the sheet. Only clear downward
  // drags are taken, so taps on buttons and scrolling inside the sheet keep working.
  const swipe = useRef(PanResponder.create({
    onMoveShouldSetPanResponderCapture: (event, gesture) => {
      const startY = event.nativeEvent.pageY - gesture.dy - sheetTop.current;
      return !!closeRef.current && startY >= -10 && startY < 84 && gesture.dy > 10 && gesture.dy > Math.abs(gesture.dx) * 1.5;
    },
    onPanResponderMove: (_, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 90 || gesture.vy > 0.9) {
        haptic.medium();
        Animated.timing(translateY, { toValue: 700, duration: 180, useNativeDriver: true }).start(() => closeRef.current?.());
      } else Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    },
    onPanResponderTerminate: () => Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start(),
  })).current;
  return (
    <Animated.View ref={sheetRef} onLayout={() => setTimeout(measureTop, 380)} {...swipe.panHandlers} style={[style, sheetUi.safeArea, { transform: [{ translateY }] }]}>
      {scrollable ? (
        <ScrollView style={sheetUi.scroll} contentContainerStyle={sheetUi.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : children}
    </Animated.View>
  );
}

// Long press on a transaction: quick actions without opening the details page first.
function TransactionMenu({ transaction, onClose, onDetails, onCategory, onUploadBill }: { transaction: FinanceTransaction; onClose: () => void; onDetails: () => void; onCategory: () => void; onUploadBill: () => void }) {
  const hasBill = transaction.billStatus === "attached";
  const options = [
    { key: "details", title: "View details", sub: "Open this transaction", Icon: FileText, action: onDetails },
    { key: "category", title: "Change category", sub: transaction.category || "Uncategorized", Icon: Tag, action: onCategory },
    ...(!hasBill ? [{ key: "bill", title: "Upload bill", sub: "Take a photo or pick one", Icon: Camera, action: onUploadBill }] : []),
  ];
  return <View style={s.overlay}>
    <Pressable style={s.overlayTap} onPress={onClose} accessibilityLabel="Close menu" />
    <SlideUpSheet style={uploadOptions.sheet} onClose={onClose}>
      <View style={s.handle} />
      <View style={uploadOptions.head}>
        <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <Text numberOfLines={1} style={uploadOptions.title}>{transaction.description || transaction.merchant}</Text>
          <Text numberOfLines={1} style={uploadOptions.subtitle}>{transaction.postedLabel} · {money(transaction.amount)}</Text>
        </View>
        <Pressable style={s.close} onPress={onClose}><Text style={s.closeText}>×</Text></Pressable>
      </View>
      {options.map(({ key, title, sub, Icon, action }) => <Pressable key={key} onPress={action} style={({ pressed }) => [uploadOptions.option, pressed && { backgroundColor: "#F5F7FC" }]} accessibilityRole="button">
        <View style={uploadOptions.icon}><Icon size={23} color="#5C70FF" strokeWidth={2.2} /></View>
        <View style={uploadOptions.optionText}><Text style={uploadOptions.optionTitle}>{title}</Text><Text numberOfLines={1} style={uploadOptions.optionSub}>{sub}</Text></View>
        <ChevronRight size={18} color="#B3BCCD" />
      </Pressable>)}
    </SlideUpSheet>
  </View>;
}

const sheetUi = StyleSheet.create({
  // Keeps every sheet clear of Android's system navigation area and prevents
  // long sheets from extending beyond the visible screen.
  safeArea: { maxHeight: "86%", paddingBottom: 52 },
  scroll: { width: "100%", flexShrink: 1 },
  scrollContent: { paddingBottom: 4 },
});

function UploadOptionsSheet({ title = "Upload bill", subtitle = "Choose how to add the bill", onClose, onCamera, onGallery, onFiles }: { title?: string; subtitle?: string; onClose: () => void; onCamera: () => void; onGallery: () => void; onFiles?: () => void }) {
  const options = [
    { title: "Take photo", subtitle: "Use the camera", Icon: Camera, action: onCamera },
    { title: "Choose from gallery", subtitle: "Photos on this device", Icon: ImageIcon, action: onGallery },
    ...(onFiles ? [{ title: "Browse files", subtitle: "JPG or PNG image", Icon: Folder, action: onFiles }] : []),
  ];
  return <View style={s.overlay}>
    <Pressable style={s.overlayTap} onPress={onClose} />
    <SlideUpSheet onClose={onClose} style={uploadOptions.sheet} scrollable>
      <View style={s.handle} />
      <View style={uploadOptions.head}>
        <View><Text style={uploadOptions.title}>{title}</Text><Text style={uploadOptions.subtitle}>{subtitle}</Text></View>
        <Pressable style={s.close} onPress={onClose}><Text style={s.closeText}>×</Text></Pressable>
      </View>
      {options.map(({ title, subtitle, Icon, action }) => <Pressable key={title} onPress={action} style={uploadOptions.option}>
        <View style={uploadOptions.icon}><Icon size={25} color="#5C70FF" strokeWidth={2.2} /></View>
        <View style={uploadOptions.optionText}><Text style={uploadOptions.optionTitle}>{title}</Text><Text style={uploadOptions.optionSub}>{subtitle}</Text></View>
      </Pressable>)}
    </SlideUpSheet>
  </View>;
}

type QuickAction = "upload" | "csv" | "search" | "charts";

// "Gestures": shaking the phone (or More → Gestures) opens these actions.
function ShakeShortcutsSheet({ source, onChoose, onClose }: { source: "shake" | "menu"; onChoose: (action: QuickAction) => void; onClose: () => void }) {
  const tiles: Array<{ id: QuickAction; title: string; subtitle: string; Icon: typeof Plus; color: string; tint: string }> = [
    { id: "upload", title: "Upload Bill", subtitle: "Take a photo or pick one", Icon: Camera, color: "#5C70FF", tint: "#EEF0FF" },
    { id: "csv", title: "Upload CSV", subtitle: "Import a bank statement", Icon: FileText, color: "#0E9F6E", tint: "#E3F6EE" },
    { id: "search", title: "Search", subtitle: "Find transactions by date", Icon: Search, color: "#D97706", tint: "#FDF1E0" },
    { id: "charts", title: "Charts", subtitle: "Spending at a glance", Icon: BarChart3, color: "#8B5CF6", tint: "#F1ECFE" },
  ];
  return <View style={s.overlay}>
    <Pressable style={s.overlayTap} onPress={onClose} accessibilityLabel="Close Gestures" />
    <SlideUpSheet onClose={onClose} style={[uploadOptions.sheet, shortcutUi.sheet]}>
      <View style={s.handle} />
      <LinearGradient colors={["#10182F", "#2B3C82"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={shortcutUi.hero}>
        <View style={shortcutUi.heroIcon}><Vibrate size={24} color="#FFF" /></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={shortcutUi.title}>Gestures</Text>
          <Text style={shortcutUi.subtitle}>{source === "shake" ? "Shake detected · jump straight in" : "Shake your phone anytime to open this"}</Text>
        </View>
        <Pressable style={shortcutUi.close} onPress={onClose} hitSlop={8} accessibilityLabel="Close"><Text style={shortcutUi.closeText}>×</Text></Pressable>
      </LinearGradient>
      <View style={shortcutUi.grid}>
        {tiles.map(({ id, title, subtitle, Icon, color, tint }) => (
          <Pressable key={id} onPress={() => onChoose(id)} style={({ pressed }) => [shortcutUi.tile, pressed && shortcutUi.tilePressed]} accessibilityRole="button" accessibilityLabel={title}>
            <View style={shortcutUi.tileTop}>
              <View style={[shortcutUi.icon, { backgroundColor: tint }]}><Icon size={24} color={color} strokeWidth={2.2} /></View>
              <ChevronRight size={18} color="#B3BCCD" />
            </View>
            <Text numberOfLines={1} style={shortcutUi.tileTitle}>{title}</Text>
            <Text numberOfLines={2} style={shortcutUi.tileSub}>{subtitle}</Text>
          </Pressable>
        ))}
      </View>
    </SlideUpSheet>
  </View>;
}

const shortcutUi = StyleSheet.create({
  sheet: { paddingTop: 12 },
  hero: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 22, padding: 16, marginBottom: 16 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  title: { color: "#FFF", fontSize: 20, fontWeight: "800" },
  subtitle: { color: "#C8D1E9", fontSize: 13, marginTop: 3 },
  close: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  closeText: { color: "#FFF", fontSize: 24, lineHeight: 26, marginTop: -2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "47.9%", minHeight: 132, borderRadius: 20, borderWidth: 1, borderColor: "#E4E8F1", backgroundColor: "#FFF", padding: 14, shadowColor: "#1B2A4E", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  tilePressed: { backgroundColor: "#F5F7FC", transform: [{ scale: 0.98 }] },
  tileTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  icon: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  tileTitle: { color: "#101A32", fontSize: 16, fontWeight: "800" },
  tileSub: { color: "#71809A", fontSize: 13, marginTop: 3, lineHeight: 17 },
});


const quickUi = StyleSheet.create({
  toastWrap: { position: "absolute", left: 0, right: 0, bottom: 140, alignItems: "center", zIndex: 30, elevation: 30 },
  toast: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#101A32", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  toastText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
});

function csvImportSummary(result: CsvImportResult) {
  const parts = [`${result.imported} ${result.imported === 1 ? 'transaction' : 'transactions'} imported`];
  if (result.duplicates) parts.push(`${result.duplicates} already saved (skipped)`);
  if (result.categoryUpdates) parts.push(`${result.categoryUpdates} category updated from the file`);
  if (result.skippedRows.length) parts.push(`${result.skippedRows.length} ${result.skippedRows.length === 1 ? 'row' : 'rows'} unreadable`);
  const smart = result.categorized ? result.categorized.fixedRules + result.categorized.learnedRules + result.categorized.ai : 0;
  if (result.imported && smart) parts.push(`${smart} auto-categorized`);
  if (result.matchedBills) parts.push(`${result.matchedBills} ${result.matchedBills === 1 ? 'bill' : 'bills'} attached`);
  return `${parts.join(' · ')}.`;
}

function CsvUploadSheet({ token, workspace, selectedBankId, onClose, onImported }: { token: string; workspace: Workspace | null; selectedBankId: string | null; onClose: () => void; onImported: () => void }) {
  const [file, setFile] = useState<{ uri: string; name: string; mimeType?: string | null } | null>(null);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [done, setDone] = useState(false);
  const choose = async () => { const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'], copyToCacheDirectory: true }); if (!result.canceled) { const asset = result.assets[0]; setDone(false); setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType }); setMessage(''); } };
  const upload = async () => { if (done || busy) return; if (!workspace?.activeBusiness || !file) { setMessage('Choose a CSV file first.'); return; } if (!selectedBankId) { setMessage('Select an institution first.'); return; } setBusy(true); setMessage(''); try { const result = await importTransactionsCsv(token, { businessId: workspace.activeBusiness.id, bankAccountId: selectedBankId, file }); setMessage(csvImportSummary(result)); setDone(true); setTimeout(onImported, result.imported ? 1600 : 2400); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to import the CSV.'); } finally { setBusy(false); } };
  useMessageHaptic(done ? '' : message, true);
  return <View style={s.overlay}>
    <Pressable style={s.overlayTap} onPress={onClose} />
    <SlideUpSheet onClose={onClose} style={uploadOptions.sheet} scrollable>
      <View style={s.handle} />
      <View style={uploadOptions.head}>
        <View><Text style={uploadOptions.title}>Upload CSV</Text><Text style={uploadOptions.subtitle}>{workspace?.activeBusiness?.name ?? 'Choose a business first'}</Text></View>
        <Pressable style={s.close} onPress={onClose}><Text style={s.closeText}>×</Text></Pressable>
      </View>
      <Pressable onPress={choose} style={uploadOptions.option}>
        <View style={uploadOptions.icon}><FileText size={25} color="#5C70FF" strokeWidth={2.2} /></View>
        <View style={uploadOptions.optionText}><Text style={uploadOptions.optionTitle}>{file?.name ?? 'Choose CSV file'}</Text><Text style={uploadOptions.optionSub}>{file ? 'Ready to import' : 'CSV columns: date, merchant/description, amount'}</Text></View>
      </Pressable>
      {!!message && <Text style={{ color: done ? '#159148' : '#D9363E', textAlign: 'center', fontWeight: '700', marginVertical: 10 }}>{message}</Text>}
      <Pressable onPress={upload} disabled={busy || !file || done} style={[uploadOptions.option, { justifyContent: 'center', backgroundColor: file && !done ? '#5C70FF' : '#A7B1FA', borderWidth: 0 }]}><Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>{busy ? 'Importing & categorizing…' : done ? 'Imported ✓' : 'Import transactions'}</Text></Pressable>
    </SlideUpSheet>
  </View>;
}

const uploadOptions = StyleSheet.create({
  sheet: { backgroundColor: "#FFF", borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 22 },
  head: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  title: { color: "#101A32", fontSize: 22, lineHeight: 28, fontWeight: "800" },
  subtitle: { color: "#748098", fontSize: 14, marginTop: 3 },
  option: { minHeight: 82, borderWidth: 1, borderColor: "#E1E6EF", borderRadius: 18, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", marginBottom: 8 },
  icon: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#EEF0FF", alignItems: "center", justifyContent: "center", marginRight: 14 },
  optionText: { flex: 1 },
  optionTitle: { color: "#101A32", fontSize: 16, fontWeight: "700" },
  optionSub: { color: "#71809A", fontSize: 14, marginTop: 2 },
});

function Auth({
  onGoogle,
  googleBusy,
  onEmail,
  email,
  onEmailChange,
  busy,
  error,
}: {
  onGoogle: () => void;
  googleBusy: boolean;
  onEmail: () => void;
  email: string;
  onEmailChange: (value: string) => void;
  busy: boolean;
  error: string;
}) {
  const loginSheetY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const moveLoginSheet = (toValue: number, duration?: number) => {
      Animated.timing(loginSheetY, {
        toValue,
        duration: duration && duration > 0 ? duration : 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };
    const onKeyboardShow = Keyboard.addListener("keyboardDidShow", (event) => {
      // Keyboard height is in screen points; the UI is drawn at UI_SCALE.
      moveLoginSheet(-event.endCoordinates.height / UI_SCALE, event.duration);
    });
    const onKeyboardHide = Keyboard.addListener("keyboardDidHide", (event) => {
      moveLoginSheet(0, event.duration);
    });
    return () => {
      onKeyboardShow.remove();
      onKeyboardHide.remove();
    };
  }, [loginSheetY]);
  const loginTitle = {
    fontSize: 32,
    fontWeight: "800" as const,
    color: "#101A32",
  };
  const loginDesc = {
    fontSize: 17,
    color: "#66748F",
    marginTop: 6,
    marginBottom: 16,
  };
  const orRow = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    marginVertical: 16,
  };
  const orLine = { height: 1, backgroundColor: "#DDE3EE", flex: 1 };
  const emailRow = {
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8E0EE",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingLeft: 18,
  };
  return (
    <View style={s.auth}>
      <StatusBar style="light" />
      <View style={s.hero}>
        <View style={s.logo}>
          <BrandMark size={96} />
        </View>
        <BrandWordmark />
        <Text style={s.brandTagline}>BUSINESS FINANCE</Text>
      </View>
      <Animated.View style={[s.sheet, { transform: [{ translateY: loginSheetY }] }]}>
          <>
            <Text style={loginTitle}>Sign in</Text>
            <Text style={loginDesc}>
              Track spending and bills for your business.
            </Text>
            <Pressable onPress={onGoogle} disabled={busy} style={[s.googleBtn, busy && { opacity: 0.6 }]} accessibilityRole="button">
              <View style={s.googleIconWrap}><GoogleIcon /></View>
              <Text style={s.googleBtnText}>{googleBusy ? "Signing in…" : "Continue with Google"}</Text>
            </Pressable>
            <View style={orRow}>
              <View style={orLine} />
              <Text style={{ color: "#8C98B1" }}>or</Text>
              <View style={orLine} />
            </View>
            <View style={emailRow}>
              <Mail size={20} color="#8D9AB4" style={{ marginRight: 10 }} />
              <TextInput
                value={email}
                onChangeText={onEmailChange}
                placeholder="name@company.com"
                placeholderTextColor="#9AA6BF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={false}
                editable={!busy}
                style={{ fontSize: 15, color: "#101A32", flex: 1, flexShrink: 1, paddingVertical: 0 }}
              />
              <Pressable
                onPress={onEmail}
                disabled={busy}
                style={{
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: busy ? "#8D99B0" : "#101A32",
                  paddingHorizontal: 10,
                  justifyContent: "center",
                  marginRight: 7,
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "800", color: "#FFF" }}
                >
                  {busy && !googleBusy ? "Sending…" : "Send code"}
                </Text>
              </Pressable>
            </View>
            {!!error && <Text style={{ color: "#D9363E", fontSize: 13, textAlign: "center", marginTop: 8 }}>{error}</Text>}
            <Text
              style={{
                fontSize: 14,
                color: "#9AA6BF",
                marginTop: error ? 5 : 8,
                textAlign: "center",
              }}
            >
              We'll send a one-time code. No password needed.
            </Text>
          </>
      </Animated.View>
    </View>
  );
}

function normalizeEmailInput(value: string) {
  return value.trim().toLowerCase();
}

function isEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function Otp({ email, code, onCodeChange, busy, sending, error, notice, resendAvailableAt, onBack, onNext, onResend, onChangeEmail }: {
  email: string;
  code: string;
  onCodeChange: (value: string) => void;
  busy: boolean;
  sending: boolean;
  error: string;
  notice: string;
  resendAvailableAt: number;
  onBack: () => void;
  onNext: () => void;
  onResend: () => void;
  onChangeEmail: (email: string) => Promise<boolean>;
}) {
  const codeInputRef = useRef<TextInput>(null);
  const [now, setNow] = useState(Date.now());
  const [editingEmail, setEditingEmail] = useState(false);
  const [draftEmail, setDraftEmail] = useState(email);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const secondsLeft = Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));
  const locked = busy || sending;
  const startEditing = () => { setDraftEmail(email); setEditingEmail(true); };
  const submitEmail = async () => {
    if (await onChangeEmail(draftEmail)) {
      setEditingEmail(false);
      setTimeout(() => codeInputRef.current?.focus(), 150);
    }
  };
  return (
    <View style={otp.screen}>
      <StatusBar style="light" />
      <View style={otp.topBar}>
        <BackButton dark onPress={onBack} label="Back to sign in" />
      </View>
      <ScrollView contentContainerStyle={otp.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={otp.mailIcon}><Mail size={28} color="#FFF" strokeWidth={2.1} /></View>
        <Text style={otp.title}>{editingEmail ? "Update your email" : "Check your email"}</Text>
        {editingEmail ? (
          <>
            <Text style={otp.subtitle}>We'll send a new 6-digit code to this address</Text>
            <View style={otp.emailEditRow}>
              <Mail size={18} color="#8D9AB4" />
              <TextInput
                value={draftEmail}
                onChangeText={setDraftEmail}
                placeholder="name@company.com"
                placeholderTextColor="#6F7C98"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                editable={!sending}
                returnKeyType="send"
                onSubmitEditing={submitEmail}
                style={otp.emailEditInput}
              />
            </View>
            {!!error && <Text style={otp.error}>{error}</Text>}
            <Pressable onPress={submitEmail} disabled={sending || !draftEmail.trim()} style={[otp.continue, (sending || !draftEmail.trim()) && otp.continueDisabled]}>
              <Text style={otp.continueText}>{sending ? "Sending…" : "Send code"}</Text>
            </Pressable>
            <Pressable onPress={() => setEditingEmail(false)} disabled={sending} style={otp.cancelEdit}>
              <Text style={otp.change}>Cancel</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={otp.subtitle}>We sent a 6-digit code to</Text>
            <View style={otp.emailChip}><Mail size={18} color="#5C70FF" /><Text style={otp.emailText}>{email}</Text></View>
            <Pressable style={otp.cells} onPress={() => codeInputRef.current?.focus()}>
              {Array.from({ length: 6 }, (_, i) => code[i] ?? "").map((v, i) => (
                <View style={[otp.cell, v && otp.filledCell]} key={i}>
                  <Text style={otp.cellText}>{v}</Text>
                </View>
              ))}
            </Pressable>
            <TextInput
              ref={codeInputRef}
              value={code}
              onChangeText={(value) => onCodeChange(value.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              editable={!busy}
              caretHidden
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              accessibilityLabel="Six-digit verification code"
              style={otp.hiddenCodeInput}
            />
            {!!notice && !error && <Text style={otp.notice}>{notice}</Text>}
            {!!error && <Text style={otp.error}>{error}</Text>}
            <Pressable onPress={onNext} disabled={locked || code.length !== 6} style={[otp.continue, (locked || code.length !== 6) && otp.continueDisabled]}>
              <Text style={otp.continueText}>{busy ? "Checking…" : "Continue"}</Text>
            </Pressable>
            <View style={otp.actions}>
              <Pressable onPress={onResend} disabled={locked || secondsLeft > 0} accessibilityRole="button">
                <Text style={[otp.resend, (locked || secondsLeft > 0) && otp.actionDisabled]}>
                  {sending ? "Sending…" : secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend code"}
                </Text>
              </Pressable>
              <View style={otp.actionDivider} />
              <Pressable onPress={startEditing} disabled={locked} accessibilityRole="button">
                <Text style={[otp.change, locked && otp.actionDisabled]}>Update email</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const otp = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#101A32", paddingTop: 52, paddingHorizontal: 26 },
  topBar: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#233552", paddingBottom: 4 },
  back: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: "#314463", alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 28, color: "#FFF", marginTop: -4 },
  body: { flexGrow: 1, alignItems: "center", paddingTop: 42, paddingBottom: 32 },
  mailIcon: { height: 54, width: 54, borderRadius: 27, borderWidth: 1, borderColor: "#5366AD", backgroundColor: "#182440", alignItems: "center", justifyContent: "center" },
  title: { marginTop: 22, fontSize: 25, fontWeight: "800", color: "#FFF" },
  subtitle: { marginTop: 10, fontSize: 15, color: "#B8C3DD" },
  emailChip: { marginTop: 11, backgroundColor: "#1C2945", borderWidth: 1, borderColor: "#314463", borderRadius: 19, height: 38, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 7 },
  emailText: { fontSize: 14, fontWeight: "600", color: "#AAB4FF" },
  cells: { width: "100%", flexDirection: "row", gap: 7, marginTop: 34 },
  cell: { flex: 1, height: 58, borderRadius: 14, borderWidth: 1, borderColor: "#314463", backgroundColor: "#182440", alignItems: "center", justifyContent: "center" },
  filledCell: { borderColor: "#7182FF", backgroundColor: "#24345C" },
  cellText: { fontSize: 22, fontWeight: "700", color: "#FFF" },
  hiddenCodeInput: { position: "absolute", height: 1, width: 1, opacity: 0 },
  error: { color: "#FFABB1", fontSize: 13, textAlign: "center", marginTop: 10 },
  notice: { color: "#9EE6B8", fontSize: 13, textAlign: "center", marginTop: 12 },
  actionDisabled: { opacity: 0.5 },
  emailEditRow: { alignSelf: "stretch", marginTop: 22, height: 58, borderRadius: 17, borderWidth: 1, borderColor: "#314463", backgroundColor: "#182440", flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10 },
  emailEditInput: { flex: 1, color: "#FFF", fontSize: 16, paddingVertical: 0 },
  cancelEdit: { marginTop: 18, padding: 6 },
  continue: { alignSelf: "stretch", height: 58, borderRadius: 17, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center", marginTop: 20 },
  continueDisabled: { backgroundColor: "#A6B0FA" },
  continueText: { fontSize: 17, fontWeight: "800", color: "#FFF" },
  actions: { flexDirection: "row", alignItems: "center", gap: 20, marginTop: 22 },
  resend: { fontSize: 14, fontWeight: "700", color: "#9EA9FF" },
  actionDivider: { height: 20, width: 1, backgroundColor: "#314463" },
  change: { fontSize: 14, fontWeight: "600", color: "#F1F4FF" },
});

function WelcomeSetup({
  onAdd,
  onLogout,
}: {
  onAdd: () => void;
  onLogout: () => void;
}) {
  const steps = [
    "Add your business and bank account",
    "Upload a bank statement (CSV)",
    "Attach bills to transactions",
  ];
  return (
    <View style={{ flex: 1, backgroundColor: "#111A31" }}>
      <StatusBar style="light" />
      <View
        style={{
          paddingTop: 58,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <BrandMark size={36} />
        <Text
          style={{
            marginLeft: 10,
            color: "#FFF",
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          MediAccounts
        </Text>
        <Pressable
          onPress={onLogout}
          style={{
            marginLeft: "auto",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#4B5773",
          }}
        >
          <Text style={{ color: "#DCE3F4", fontSize: 14, fontWeight: "600" }}>
            Sign out
          </Text>
        </Pressable>
      </View>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 36,
          paddingBottom: 52,
        }}
      >
        <View
          style={{
            height: 92,
            width: 92,
            borderRadius: 46,
            backgroundColor: "#222D47",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Building2 size={40} color="#AEBBFF" strokeWidth={1.8} />
        </View>
        <Text
          style={{
            marginTop: 24,
            color: "#FFF",
            fontSize: 28,
            fontWeight: "700",
          }}
        >
          No business yet
        </Text>
        <Text
          style={{
            marginTop: 10,
            color: "#B9C3D9",
            fontSize: 16,
            lineHeight: 23,
            textAlign: "center",
          }}
        >
          Start by adding your business. You can upload statements and bills
          afterward.
        </Text>
      </View>
      <View
        style={{
          backgroundColor: "#FFF",
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          paddingHorizontal: 22,
          paddingTop: 23,
          paddingBottom: 34,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#47536C",
            marginBottom: 14,
          }}
        >
          Getting started
        </Text>
        {steps.map((step, index) => (
          <View
            key={step}
            style={{
              minHeight: 64,
              borderRadius: 16,
              backgroundColor: "#F5F7FB",
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              marginBottom: 9,
            }}
          >
            <View
              style={{
                height: 28,
                width: 28,
                borderRadius: 9,
                backgroundColor: "#E9EDFF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "#5C70FF", fontSize: 14, fontWeight: "700" }}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                color: "#202A40",
                fontSize: 15,
                fontWeight: "500",
              }}
            >
              {step}
            </Text>
          </View>
        ))}
        <Pressable
          onPress={onAdd}
          style={{
            height: 56,
            borderRadius: 17,
            backgroundColor: "#5C70FF",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 9,
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 17, fontWeight: "700" }}>
            Add business
          </Text>
        </Pressable>
        <Text
          style={{
            color: "#8996AF",
            fontSize: 13,
            lineHeight: 19,
            textAlign: "center",
            marginTop: 14,
          }}
        >
          If an admin invited you, your business will appear here once access is
          granted.
        </Text>
      </View>
    </View>
  );
}

function Empty({
  onAdd,
  onLogout,
}: {
  onAdd: () => void;
  onLogout: () => void;
}) {
  const steps = [
    "Add your business and bank account",
    "Upload your bank statement (CSV)",
    "Attach bills to transactions",
  ];
  return (
    <View style={{ flex: 1, backgroundColor: "#10182D" }}>
      <StatusBar style="light" />
      <View
        style={{
          paddingTop: 59,
          paddingHorizontal: 24,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <BrandMark size={34} />
          <Text style={{ color: "#FFF", fontSize: 17, fontWeight: "800" }}>
            MediAccounts
          </Text>
        </View>
        <Pressable
          onPress={onLogout}
          style={{
            paddingHorizontal: 13,
            paddingVertical: 9,
            borderRadius: 11,
            borderWidth: 1,
            borderColor: "#48516B",
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>
            Sign out
          </Text>
        </Pressable>
      </View>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 30,
        }}
      >
        <View
          style={{
            height: 118,
            width: 118,
            borderRadius: 59,
            backgroundColor: "#202940",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              height: 72,
              width: 62,
              borderRadius: 16,
              backgroundColor: "#FFF",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 32, color: "#5C70FF" }}>▥</Text>
          </View>
        </View>
        <Text
          style={{
            color: "#FFF",
            fontSize: 28,
            fontWeight: "800",
            marginTop: 25,
          }}
        >
          No business yet
        </Text>
        <Text
          style={{
            color: "#B7C0D8",
            fontSize: 16,
            textAlign: "center",
            lineHeight: 23,
            marginTop: 10,
          }}
        >
          Add your first business to start tracking spending, bills, and
          reports.
        </Text>
      </View>
      <View
        style={{
          backgroundColor: "#FFF",
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          padding: 24,
          paddingBottom: 42,
        }}
      >
        {steps.map((x, i) => (
          <View
            key={x}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 13,
              backgroundColor: "#F4F6FA",
              borderRadius: 14,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                height: 27,
                width: 27,
                borderRadius: 8,
                backgroundColor: "#5C70FF",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFF", fontWeight: "800" }}>{i + 1}</Text>
            </View>
            <Text style={{ color: "#101A32", fontSize: 14, fontWeight: "600" }}>
              {x}
            </Text>
          </View>
        ))}
        <Pressable
          onPress={onAdd}
          style={{
            height: 56,
            borderRadius: 17,
            backgroundColor: "#5C70FF",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 17, fontWeight: "800" }}>
            ＋ Add business
          </Text>
        </Pressable>
        <Text
          style={{
            color: "#9AA6BF",
            fontSize: 12,
            textAlign: "center",
            lineHeight: 18,
            marginTop: 13,
          }}
        >
          Invited by your admin? Your business appears here once they add you.
        </Text>
      </View>
    </View>
  );
}

/** Street part of a picked address, e.g. "Unit 3, 250 Fort York Blvd" (no city, province or postal code). */
function streetLine(address: { businessAddress: string; addressLine2: string; formattedAddress?: string }) {
  const street = (address.formattedAddress ?? '').split(',')[0]?.trim() || address.businessAddress;
  const unit = address.addressLine2?.trim();
  if (!unit) return street;
  // Google often already puts the suite in the street line ("123 Edward St Ste 600").
  const unitNumber = unit.replace(/^(unit|suite|ste|apt|apartment|#)\.?\s*/i, '').toLowerCase();
  if (street.toLowerCase().includes(unitNumber)) return street;
  return /^[a-z#]/i.test(unit) ? `${unit}, ${street}` : `Unit ${unit}, ${street}`;
}

type PickedPhoto = { uri: string; name: string; mimeType?: string | null };

/** Gray person silhouette for users without a profile photo. */
function DefaultAvatar({ size = 48, radius = 14 }: { size?: number; radius?: number }) {
  return <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: "#E5E8EF", overflow: "hidden", alignItems: "center", justifyContent: "flex-end" }}>
    <Svg width={size * 0.78} height={size * 0.82} viewBox="0 0 64 68">
      <SvgCircle cx="32" cy="22" r="14" fill="#B4BBC8" />
      <Path d="M4 68 C4 50 16 40 32 40 C48 40 60 50 60 68 Z" fill="#B4BBC8" />
    </Svg>
  </View>;
}

/** Image from the backend (needs the login token), shown from a local copy. */
function AuthImage({ token, url, cacheKey, style }: { token: string; url: string; cacheKey: string; style: any }) {
  const [uri, setUri] = useState("");
  useEffect(() => {
    let active = true;
    void downloadBillPreview(token, url, cacheKey.replace(/[^a-z0-9-]/gi, ""), "image/jpeg").then((local) => { if (active) setUri(local); }).catch(() => undefined);
    return () => { active = false; };
  }, [token, url, cacheKey]);
  return uri ? <LoadingImage uri={uri} style={style} /> : <View style={[style, loadingImageUi.frame]}><ActivityIndicator size="small" color="#8A96AC" /></View>;
}

/**
 * Display only: an image that shows a spinner in its place until the photo has appeared, and an
 * "image unavailable" icon if it can't be shown, so a slow photo never looks like a blank box.
 * `style` sizes the frame; the photo fills it.
 */
function LoadingImage({ uri, style, resizeMode = "cover", dark = false }: { uri: string; style: any; resizeMode?: "cover" | "contain"; dark?: boolean }) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");
  useEffect(() => { setState("loading"); }, [uri]);
  return <View style={[style, loadingImageUi.frame, dark && loadingImageUi.dark]}>
    <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode={resizeMode} onLoad={() => setState("loaded")} onError={() => setState("failed")} />
    {state !== "loaded" && <View pointerEvents="none" style={loadingImageUi.overlay}>
      {state === "loading" ? <ActivityIndicator size="small" color={dark ? "#FFF" : "#5C70FF"} /> : <ImageOff size={24} color={dark ? "#C8CFDC" : "#9AA5BB"} />}
    </View>}
  </View>;
}

const loadingImageUi = StyleSheet.create({
  frame: { backgroundColor: "#EEF1F6", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  dark: { backgroundColor: "transparent" },
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
});

/** Building icon in a light tile, shown in lists for a business without a logo. */
function BusinessIconTile({ size = 40, radius = 12 }: { size?: number; radius?: number }) {
  return <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: "#F1F3F8", borderWidth: 1, borderColor: "#E4E8F1", alignItems: "center", justifyContent: "center" }}>
    <Building2 size={Math.round(size * 0.5)} color="#69758C" />
  </View>;
}

/** A business's logo when it has one; otherwise `fallback` (or nothing). */
function BusinessLogo({ business, size = 22, radius = 6, fallback = null }: { business?: { id: string; logoUpdatedAt?: string | null } | null; size?: number; radius?: number; fallback?: ReactNode }) {
  if (!business?.logoUpdatedAt || !sessionTokenStore.current) return <>{fallback}</>;
  return <AuthImage token={sessionTokenStore.current} url={businessLogoUrl(business.id)} cacheKey={`logo-${business.id}-${business.logoUpdatedAt}`}
    style={{ width: size, height: size, borderRadius: radius, borderWidth: 1, borderColor: "#E4E8F1", backgroundColor: "#FFF" }} />;
}

/** Camera or gallery for an optional photo (logo, profile photo). Render `sheet` at the page root. */
function usePhotoSource(onPicked: (photo: PickedPhoto) => void, title: string) {
  const [open, setOpen] = useState(false);
  useBackHandler(open, () => setOpen(false));
  const pick = async (source: "camera" | "gallery") => {
    setOpen(false);
    if (!(await requestBillMediaPermission(source))) return;
    // No crop step: the chosen or captured photo is used as it is.
    const options = { mediaTypes: ["images"] as ImagePicker.MediaType[], allowsEditing: false, quality: 0.8 };
    const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) { const asset = result.assets[0]; onPicked({ uri: asset.uri, name: asset.fileName ?? `photo-${Date.now()}.jpg`, mimeType: asset.mimeType ?? "image/jpeg" }); }
  };
  const sheet = open ? <UploadOptionsSheet title={title} subtitle="Take a photo or choose one" onClose={() => setOpen(false)} onCamera={() => void pick("camera")} onGallery={() => void pick("gallery")} /> : null;
  return { open, openSheet: () => { Keyboard.dismiss(); setOpen(true); }, sheet };
}

/** Looks like a text input; tapping it asks for camera or gallery. */
function PhotoInputField({ label, placeholder, value, onPress, onRemove, labelStyle, fieldStyle, round = false, savedThumb }: { label: string; placeholder: string; value: PickedPhoto | null; onPress: () => void; onRemove: () => void; labelStyle?: any; fieldStyle?: any; round?: boolean; savedThumb?: ReactNode }) {
  const hasImage = !!value || !!savedThumb;
  return <View>
    <Text style={labelStyle}>{label}</Text>
    <Pressable onPress={onPress} style={({ pressed }) => [fieldStyle, photoUi.field, pressed && { backgroundColor: "#F7F8FB" }]} accessibilityRole="button" accessibilityLabel={label}>
      {value ? <Image source={{ uri: value.uri }} style={[photoUi.thumb, round && photoUi.round]} /> : savedThumb ?? <View style={[photoUi.thumb, photoUi.empty, round && photoUi.round]}><ImagePlus size={16} color="#8A96AD" /></View>}
      <Text numberOfLines={1} style={[photoUi.text, !hasImage && photoUi.placeholder, !!value && photoUi.selected]}>{value ? "Selected" : savedThumb ? "Change" : placeholder}</Text>
      {!!value && <View style={photoUi.tick}><Check size={12} color="#FFF" strokeWidth={3.5} /></View>}
      {hasImage
        ? <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={`Remove ${label.toLowerCase()}`}><Text style={photoUi.remove}>×</Text></Pressable>
        : <Camera size={18} color="#9AA6BF" />}
    </Pressable>
  </View>;
}

const photoUi = StyleSheet.create({
  field: { flexDirection: "row", alignItems: "center", gap: 10 },
  thumb: { width: 32, height: 32, borderRadius: 8 },
  empty: { backgroundColor: "#F1F3F8", alignItems: "center", justifyContent: "center" },
  round: { borderRadius: 16 },
  text: { flex: 1, minWidth: 0, color: "#101A32", fontSize: 15 },
  placeholder: { color: "#9AA6BF" },
  remove: { color: "#D9363E", fontSize: 24, lineHeight: 26, fontWeight: "600" },
  selected: { color: "#159148", fontWeight: "700" },
  tick: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#16A34A", alignItems: "center", justifyContent: "center" },
});

function NewBusiness({
  onBack,
  onCreate,
  token,
}: {
  onBack: () => void;
  onCreate: (business: AuthSession['businesses'][number]) => Promise<void>;
  token: string;
}) {
  const keyboardScroll = useKeyboardScroll(useRef<ScrollView>(null));
  const [name, setName] = useState("");
  const [aliasName, setAliasName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressFocused, setAddressFocused] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const [addressError, setAddressError] = useState("");
  // The text a picked suggestion put in the field; no new search runs until the user edits it.
  const pickedAddress = useRef<string | null>(null);
  const newPlacesSession = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const placesSession = useRef(newPlacesSession());
  const nextInstitutionKey = useRef(1);
  const [institutions, setInstitutions] = useState([{ key: 0, name: "", accountNumber: "", accountType: "Chequing Account", cardType: "", isPrimary: true }]);
  const [logo, setLogo] = useState<PickedPhoto | null>(null);
  const logoSource = usePhotoSource(setLogo, "Business logo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const field = {
    height: 52,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E1E6F0",
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    color: "#101A32",
    fontSize: 15,
  };
  const label = {
    fontSize: 12,
    fontWeight: "800" as const,
    color: "#101A32",
    marginBottom: 7,
  };
  const ready = !!name.trim() && !!businessAddress.trim() && institutions.every((item) => item.name.trim() && item.accountNumber.trim() && (!isCardAccount(item.accountType) || !!item.cardType)) && !saving;
  const updateInstitution = (index: number, patch: Partial<typeof institutions[number]>) => setInstitutions((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  // Google Places suggestions (through the backend) after the user pauses typing.
  useEffect(() => {
    if (pickedAddress.current !== null && businessAddress === pickedAddress.current) { setAddressSuggestions([]); setAddressSearching(false); return; }
    const input = businessAddress.trim();
    if (!addressFocused || input.length < 3 || !token) { setAddressSuggestions([]); setAddressSearching(false); return; }
    let active = true;
    setAddressSearching(true);
    const timer = setTimeout(() => {
      void searchAddresses(token, input, placesSession.current)
        .then((result) => { if (active) { setAddressSuggestions(result.suggestions); setAddressError(""); } })
        .catch((cause) => { if (active) { setAddressSuggestions([]); setAddressError(cause instanceof Error ? cause.message : "Address search is unavailable."); } })
        .finally(() => { if (active) setAddressSearching(false); });
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [businessAddress, addressFocused, token]);
  const chooseAddress = async (suggestion: AddressSuggestion) => {
    pickedAddress.current = suggestion.primary;
    setBusinessAddress(suggestion.primary);
    setAddressSuggestions([]);
    setAddressFocused(false);
    Keyboard.dismiss();
    try {
      const { address } = await getAddressDetails(token, suggestion.placeId, placesSession.current);
      // Business address shows the full address; the Address box gets just the street.
      const full = address.formattedAddress || address.businessAddress || suggestion.primary;
      pickedAddress.current = full;
      setBusinessAddress(full);
      setAddressLine2(streetLine(address));
      setCity(address.city);
      setProvince(address.province);
      setPostalCode(address.postalCode);
      setAddressError("");
    } catch (cause) {
      setAddressError(cause instanceof Error ? cause.message : "Unable to load that address.");
    } finally {
      placesSession.current = newPlacesSession();
    }
  };
  const removeInstitution = (index: number) => setInstitutions((items) => {
    const remaining = items.filter((_, itemIndex) => itemIndex !== index);
    // Keep exactly one primary institution.
    return remaining.some((item) => item.isPrimary) ? remaining : remaining.map((item, itemIndex) => ({ ...item, isPrimary: itemIndex === 0 }));
  });
  const create = async () => {
    if (!ready) return;
    setSaving(true); setError("");
    try {
      const result = await createBusiness(token, { name: name.trim(), aliasName: aliasName.trim(), businessAddress: businessAddress.trim(), addressLine2: addressLine2.trim(), city: city.trim(), province: province.trim(), postalCode: postalCode.trim(), institutions: institutions.map(({ key: _key, ...institution }) => ({ ...institution, cardType: isCardAccount(institution.accountType) ? institution.cardType : null })) });
      // The logo is optional; if its upload fails the business is still created.
      let created = result.business;
      if (logo) created = await uploadBusinessLogo(token, result.business.id, logo).then((saved) => ({ ...result.business, logoUpdatedAt: saved.logoUpdatedAt ?? null })).catch(() => result.business);
      await onCreate(created);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create the business.'); }
    finally { setSaving(false); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: "#F4F6FA" }}>
      <StatusBar style="dark" />
      <View
        style={{
          paddingTop: 57,
          padding: 20,
          backgroundColor: "#FFF",
          borderBottomWidth: 1,
          borderColor: "#E7EAF3",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <BackButton onPress={onBack} />
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#101A32" }}>
          Add business
        </Text>
      </View>
      <ScrollView
        {...keyboardScroll.scrollProps}
        contentContainerStyle={{ padding: 16, paddingBottom: 35, gap: 14 }}
        // Let a tap on an address suggestion select it instead of only closing the keyboard.
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            padding: 17,
            borderRadius: 21,
            backgroundColor: "#FFF",
            borderWidth: 1,
            borderColor: "#E7EAF3",
          }}
        >
          <Text style={label}>Business name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            
            style={field}
          />
          <View style={newBizUi.pair}>
            <View style={newBizUi.half}><Text style={label}>Alias name</Text><TextInput value={aliasName} onChangeText={setAliasName} style={field} /></View>
            <View style={newBizUi.half}><PhotoInputField label="Logo (optional)" placeholder="Upload" value={logo} onPress={logoSource.openSheet} onRemove={() => setLogo(null)} labelStyle={label} fieldStyle={[field, newBizUi.logoField]} /></View>
          </View>
          <Text style={[label, { marginTop: 15 }]}>Business address *</Text>
          <View style={{ justifyContent: "center" }}>
            <TextInput value={businessAddress} onChangeText={(value) => { pickedAddress.current = null; setBusinessAddress(value); setAddressFocused(true); }} onFocus={() => setAddressFocused(true)} onBlur={() => setTimeout(() => setAddressFocused(false), 200)}  autoCorrect={false} style={[field, { paddingRight: 40 }]} />
            {addressSearching ? <ActivityIndicator size="small" color="#5C70FF" style={{ position: "absolute", right: 12 }} /> : <Search size={18} color="#9AA6BF" style={{ position: "absolute", right: 12 }} />}
          </View>
          {addressFocused && addressSuggestions.length > 0 && <View style={{ borderWidth: 1, borderColor: '#E1E6F0', borderRadius: 13, backgroundColor: '#FFF', marginTop: 6, overflow: 'hidden' }}>{addressSuggestions.map((item, index) => <Pressable key={item.placeId} onPress={() => void chooseAddress(item)} style={{ paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: index ? 1 : 0, borderTopColor: '#EDF0F5' }}><Text numberOfLines={1} style={{ color: '#17223A', fontWeight: '700' }}>{item.primary}</Text>{!!item.secondary && <Text numberOfLines={1} style={{ color: '#71809A', fontSize: 12, marginTop: 2 }}>{item.secondary}</Text>}</Pressable>)}<Text style={{ color: '#A0A9BA', fontSize: 10, textAlign: 'right', paddingHorizontal: 10, paddingVertical: 4 }}>Powered by Google</Text></View>}
          {!!addressError && <Text style={{ color: '#B7791F', fontSize: 12, marginTop: 6 }}>{addressError} You can still type the address.</Text>}
          <View style={newBizUi.pair}>
            <View style={newBizUi.half}><Text style={label}>Address</Text><TextInput value={addressLine2} onChangeText={setAddressLine2} style={field} /></View>
            <View style={newBizUi.half}><Text style={label}>City</Text><TextInput value={city} onChangeText={setCity} style={field} /></View>
          </View>
          <View style={newBizUi.pair}>
            <View style={newBizUi.half}><Text style={label}>Province</Text><TextInput value={province} onChangeText={setProvince} style={field} /></View>
            <View style={newBizUi.half}><Text style={label}>Postal code</Text><TextInput value={postalCode} onChangeText={setPostalCode} autoCapitalize="characters" style={field} /></View>
          </View>
        </View>
        {/* Add another institution: shown above the institution cards. */}
        <View style={newBizUi.addRow}>
          <Pressable onPress={() => { haptic.light(); setInstitutions((items) => [...items, { key: nextInstitutionKey.current++, name: '', accountNumber: '', accountType: 'Chequing Account', cardType: '', isPrimary: false }]); }} style={({ pressed }) => [newBizUi.addMore, pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }]} accessibilityRole="button" accessibilityLabel="Add another institution">
            <Plus size={16} color="#FFF" strokeWidth={2.8} />
            <Text style={newBizUi.addMoreText}>Add more</Text>
          </Pressable>
        </View>
          {/* Same layout as the Add institution page. */}
          {institutions.map((institution, index) => {
            const isCard = isCardAccount(institution.accountType);
            return <View key={institution.key} style={[newBizUi.institutionCard, index > 0 && newBizUi.extraCard]}>
              {index > 0 && <View style={newBizUi.institutionHead}>
                <View style={newBizUi.countBadge}><Text style={newBizUi.countBadgeText}>Account {index + 1}</Text></View>
                <Pressable onPress={() => removeInstitution(index)} hitSlop={8} style={newBizUi.remove} accessibilityRole="button" accessibilityLabel={`Remove institution ${index + 1}`}><Text style={newBizUi.removeText}>✕ Remove</Text></Pressable>
              </View>}
              <Text style={label}>Institution name *</Text>
              <TextInput value={institution.name} onChangeText={(value) => updateInstitution(index, { name: value })} placeholder="e.g. CIBC" placeholderTextColor="#B8C0CE" autoCapitalize="words" style={field} />

              <Text style={instUi.sectionLabel}>Account type</Text>
              <View style={instUi.typeGrid}>
                {ACCOUNT_TYPES.map((type) => {
                  const selected = institution.accountType === type;
                  const Icon = ACCOUNT_TYPE_ICONS[type] ?? Landmark;
                  return <Pressable key={type} onPress={() => updateInstitution(index, { accountType: type, cardType: isCardAccount(type) ? institution.cardType : '', accountNumber: institution.accountNumber.slice(0, isCardAccount(type) ? 16 : 17) })} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={type}
                    style={({ pressed }) => [instUi.typeCard, selected && instUi.typeCardOn, pressed && { opacity: 0.85 }]}>
                    <View style={[instUi.typeIcon, selected && instUi.typeIconOn]}><Icon size={20} color={selected ? "#FFF" : "#5B6882"} strokeWidth={2.2} /></View>
                    <Text numberOfLines={1} style={[instUi.typeLabel, selected && instUi.typeLabelOn]}>{type.replace(" Account", "")}</Text>
                    {selected && <View style={instUi.typeCheck}><Check size={11} color="#FFF" strokeWidth={3.5} /></View>}
                  </Pressable>;
                })}
              </View>

              {isCard && <>
                <Text style={instUi.sectionLabel}>Card type <Text style={{ color: "#E13B48" }}>*</Text></Text>
                <View style={instUi.cardRow}>
                  {CARD_TYPES.map((type) => {
                    const selected = institution.cardType === type;
                    const Logo = type === "Visa" ? VisaIcon : MastercardIcon;
                    return <Pressable key={type} onPress={() => updateInstitution(index, { cardType: type })} style={({ pressed }) => [instUi.cardTile, selected && instUi.cardTileOn, pressed && { opacity: 0.85 }]} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={type}>
                      <View style={[instUi.cardLogo, selected && instUi.cardLogoOn]}><Logo width={58} height={38} /></View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={[instUi.cardName, selected && instUi.tileTextOn]}>{type}</Text>
                        <Text numberOfLines={1} style={instUi.cardHint}>{type === "Visa" ? "Visa card" : "Mastercard"}</Text>
                      </View>
                      <View style={[instUi.radio, selected && instUi.radioOn]}>{selected && <Check size={13} color="#FFF" strokeWidth={3.5} />}</View>
                    </Pressable>;
                  })}
                </View>
              </>}

              <Text style={[label, { marginTop: 20 }]}>{institution.accountType} number *</Text>
              <TextInput keyboardType="number-pad" maxLength={isCard ? 16 : 17} value={institution.accountNumber} onChangeText={(value) => updateInstitution(index, { accountNumber: value.replace(/\D/g, '') })} placeholder={isCard ? "16-digit card number" : "Account number"} placeholderTextColor="#B8C0CE" style={field} />

              <Pressable onPress={() => { if (!institution.isPrimary) setInstitutions((items) => items.map((item, itemIndex) => ({ ...item, isPrimary: itemIndex === index }))); }} style={instUi.primaryRow} accessibilityRole="switch" accessibilityState={{ checked: institution.isPrimary }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={instUi.primaryTitle}>Primary account</Text>
                  <Text style={instUi.primarySub}>Used by default for this business.</Text>
                </View>
                <View style={[instUi.track, institution.isPrimary && instUi.trackOn]}><View style={[instUi.thumb, institution.isPrimary && instUi.thumbOn]} /></View>
              </Pressable>
            </View>;
          })}
        {!!error && <Text style={{ color: '#D9363E', textAlign: 'center', fontWeight: '600' }}>{error}</Text>}
        <Pressable
          onPress={create}
          style={{
            height: 56,
            borderRadius: 17,
            backgroundColor: ready ? "#5C70FF" : "#C3CBFF",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 17, fontWeight: "800" }}>
            {saving ? 'Creating…' : 'Create business'}
          </Text>
        </Pressable>
        <View style={{ height: keyboardScroll.keyboardSpace }} />
      </ScrollView>
      {logoSource.sheet}
    </View>
  );
}

const newBizUi = StyleSheet.create({
  pair: { flexDirection: "row", gap: 10, marginTop: 15 },
  half: { flex: 1, minWidth: 0 },
  logoField: { paddingHorizontal: 10, gap: 8 },
  institutionCard: { padding: 17, borderRadius: 21, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E7EAF3" },
  // Each added institution is its own card with a coloured edge so it reads as a separate account.
  extraCard: { borderColor: "#C9D0FF", borderLeftWidth: 4, borderLeftColor: "#5C70FF" },
  institutionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  countBadge: { borderRadius: 999, backgroundColor: "#EEF0FF", paddingHorizontal: 12, paddingVertical: 5 },
  countBadgeText: { color: "#4B5BE0", fontSize: 13, fontWeight: "800" },
  addRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: -4 },
  addMore: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, backgroundColor: "#5C70FF", paddingHorizontal: 16, paddingVertical: 9, shadowColor: "#5C70FF", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  addMoreText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  remove: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: "#FFF0F1" },
  removeText: { color: "#E13B48", fontSize: 12, fontWeight: "800" },
});

function transactionsForPeriod(transactions: FinanceTransaction[], period: 'This month' | 'Last month' | 'This quarter' | 'Year to date') {
  if (!transactions.length) return [];
  // Imported statements may be historical. Anchor the filter to the most recent
  // imported transaction so the selected period always describes this business's data.
  const latest = transactions.reduce((value, item) => item.postedOn > value ? item.postedOn : value, transactions[0].postedOn);
  const anchor = new Date(`${latest.slice(0, 10)}T12:00:00`);
  return transactions.filter((item) => {
    const date = new Date(`${item.postedOn.slice(0, 10)}T12:00:00`);
    if (period === 'This month') return date.getFullYear() === anchor.getFullYear() && date.getMonth() === anchor.getMonth();
    if (period === 'Last month') return date.getFullYear() === new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1).getFullYear() && date.getMonth() === new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1).getMonth();
    if (period === 'This quarter') return date.getFullYear() === anchor.getFullYear() && Math.floor(date.getMonth() / 3) === Math.floor(anchor.getMonth() / 3);
    return date.getFullYear() === anchor.getFullYear();
  });
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function transactionsCsv(transactions: FinanceTransaction[]) {
  const header = ["Date", "Merchant", "Description", "Category", "Amount", "GST", "PST", "Bill", "Bank account", "Memo"];
  const rows = transactions.map((item) => [
    String(item.postedOn).slice(0, 10),
    item.merchant,
    item.description,
    item.category,
    Number(item.amount).toFixed(2),
    Number(item.gst || 0).toFixed(2),
    Number(item.pst || 0).toFixed(2),
    item.billStatus === "attached" ? "Attached" : "Missing",
    [item.bankAccountName, item.bankAccountNumber].filter(Boolean).join(" "),
    item.memo,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** Latest-added first: rows saved in the same second (one CSV import) are grouped, then by date and save order. */
function recentlyAdded(transactions: FinanceTransaction[], limit: number) {
  const batch = (item: FinanceTransaction) => (item.createdAt ?? "").slice(0, 19);
  return [...transactions].sort((a, b) =>
    batch(b).localeCompare(batch(a))
    || String(b.postedOn).slice(0, 10).localeCompare(String(a.postedOn).slice(0, 10))
    || String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")),
  ).slice(0, limit);
}

function transactionSummary(transactions: FinanceTransaction[]) {
  return { spent: transactions.reduce((sum, item) => sum + Math.abs(numberValue(item.amount)), 0), categoryCount: new Set(transactions.map((item) => item.category).filter(Boolean)).size, billsMissing: transactions.filter((item) => item.billStatus === 'missing').length, gstClaimable: transactions.reduce((sum, item) => sum + numberValue(item.gst), 0), transactionCount: transactions.length };
}

/** The logo fades and grows in, the name follows, then the intro fades away over the sign-in page (2 s). */
function LaunchIntro({ onDone }: { onDone: () => void }) {
  const logo = useRef(new Animated.Value(0)).current;
  const name = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(logo, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(name, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(450),
      Animated.timing(fade, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]);
    animation.start(() => done.current());
    return () => animation.stop();
  }, []);
  return <Animated.View pointerEvents="none" style={[introUi.screen, { opacity: fade }]}>
    <StatusBar style="light" />
    <Animated.View style={{ opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }}>
      <BrandMark size={96} />
    </Animated.View>
    <Animated.View style={[introUi.name, { opacity: name, transform: [{ translateY: name.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
      <BrandWordmark />
    </Animated.View>
  </Animated.View>;
}

const introUi = StyleSheet.create({
  screen: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "#101A32", alignItems: "center", justifyContent: "center" },
  name: { marginTop: 22 },
  host: { flex: 1, backgroundColor: "#101A32" },
});

function PageLoader({ label = "Loading…", dark = false }: { label?: string; dark?: boolean }) {
  return <View style={[loaderUi.page, dark && loaderUi.pageDark]}>
    {dark && <StatusBar style="light" />}
    <ActivityIndicator size="large" color={dark ? "#AAB4FF" : "#5C70FF"} />
    <Text style={[loaderUi.label, dark && loaderUi.labelDark]}>{label}</Text>
  </View>;
}

// Shows the loading placeholders for a moment (tab switch, filter change) so the change is visible.
function useBriefLoading(duration = 500, startActive = false) {
  const [active, setActive] = useState(startActive);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (startActive) timer.current = setTimeout(() => setActive(false), duration);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);
  const trigger = () => {
    setActive(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(false), duration);
  };
  return [active, trigger] as const;
}

/** Shows `placeholder` for a moment each time the screen opens, then the real content. */
function OpeningPlaceholder({ placeholder, children, duration = 600 }: { placeholder: ReactNode; children: ReactNode; duration?: number }) {
  const [opening] = useBriefLoading(duration, true);
  return <>{opening ? placeholder : children}</>;
}

const LIST_PAGE_SIZE = 20;

// Long lists render in pages of 20: when the user scrolls near the end, a loader
// shows and the next rows are added. resetKey restarts from the first page.
function useIncrementalList<T>(items: T[], resetKey: string) {
  const [count, setCount] = useState(LIST_PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setCount(LIST_PAGE_SIZE);
    setLoadingMore(false);
  }, [resetKey]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const hasMore = count < items.length;
  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    timer.current = setTimeout(() => { setCount((current) => current + LIST_PAGE_SIZE); setLoadingMore(false); }, 350);
  };
  const onScroll = (event: { nativeEvent: { layoutMeasurement: { height: number }; contentOffset: { y: number }; contentSize: { height: number } } }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 240) loadMore();
  };
  return { visible: items.slice(0, count), hasMore, onScroll };
}

function ListFooterLoader({ hasMore }: { hasMore: boolean }) {
  return hasMore ? <View style={loaderUi.footer}><ActivityIndicator color="#5C70FF" /></View> : null;
}

const loaderUi = StyleSheet.create({
  page: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, backgroundColor: "#F4F6FA", paddingBottom: 120 },
  pageDark: { backgroundColor: "#101A32", paddingBottom: 0 },
  label: { color: "#66748F", fontSize: 15, fontWeight: "600" },
  labelDark: { color: "#B8C3DD" },
  footer: { paddingVertical: 20, alignItems: "center" },
  inline: { paddingVertical: 40, alignItems: "center" },
});

function MarqueeRemark({ text }: { text: string }) {
  return <ContinuousMarquee text={text} clipStyle={ui.homeMerchantClip} textStyle={ui.homeMerchant} />;
}

function SummaryMarquee({ text, style }: { text: string; style: object; scrollAfter?: number }) {
  return <ContinuousMarquee text={text} clipStyle={{ width: "100%" }} textStyle={style} />;
}

// Shows the whole text: short text stays still, and text wider than its container
// scrolls from the first letter to the last, then repeats.
function ContinuousMarquee({ text, clipStyle, textStyle }: { text: string; clipStyle: object; textStyle: object; scrollAfter?: number }) {
  const translate = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const gap = 32;
  const shouldScroll = containerWidth > 0 && textWidth > containerWidth + 1;
  const travelDistance = textWidth + gap;

  useEffect(() => {
    translate.setValue(0);
    if (!shouldScroll) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(1200),
      Animated.timing(translate, { toValue: -travelDistance, duration: Math.max(3000, travelDistance * 22), easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [shouldScroll, text, translate, travelDistance]);

  return (
    <View style={[clipStyle, { overflow: "hidden" }]} onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
      {/* The wide row lets the text keep its natural width instead of being cut to the container. */}
      <Animated.View style={{ width: 4000, flexDirection: "row", transform: [{ translateX: translate }] }}>
        <Text numberOfLines={1} onLayout={(event) => setTextWidth(event.nativeEvent.layout.width)} style={[textStyle, { flexShrink: 0 }]}>{text}</Text>
        {shouldScroll && <Text numberOfLines={1} style={[textStyle, { flexShrink: 0, marginLeft: gap }]}>{text}</Text>}
      </Animated.View>
    </View>
  );
}

// One transaction row, shared by Home and the Transactions page so both lists look identical.
function TransactionRow({ item, last, onPress, onLongPress }: { item: FinanceTransaction; last: boolean; onPress: () => void; onLongPress?: (item: FinanceTransaction) => void }) {
  const hasBill = item.billStatus === 'attached';
  return <Pressable onPress={onPress} onLongPress={onLongPress ? () => { haptic.light(); onLongPress(item); } : undefined} delayLongPress={420} style={({ pressed }) => [ui.homeTransactionRow, !last && ui.homeTransactionBorder, pressed && { backgroundColor: '#F5F7FC' }]}>
    <TransactionLines title={<MarqueeRemark text={item.description || item.merchant} />} amount={money(item.amount)} meta={`${item.postedLabel} · ${item.category}`} hasBill={hasBill} />
  </Pressable>;
}

// Two aligned lines used by every transaction list:
// title ↔ amount on the first line, date · category ↔ bill badge on the second.
function TransactionLines({ title, amount, meta, hasBill, amountStyle }: { title: ReactNode; amount: string; meta: string; hasBill: boolean; amountStyle?: any }) {
  return <View style={ui.linesWrap}>
    <View style={[ui.line, ui.lineFirst]}>
      <View style={ui.lineLeft}>{title}</View>
      <View style={ui.lineRight}><Text numberOfLines={1} style={[ui.homeAmount, ui.lineAmount, amountStyle]}>{amount}</Text></View>
    </View>
    <View style={[ui.line, ui.lineSecond]}>
      <View style={ui.lineLeft}><Text numberOfLines={1} style={ui.lineMeta}>{meta}</Text></View>
      <View style={ui.lineRight}>
        <View style={[ui.homeBillDot, ui.lineBadge, hasBill ? ui.homeBillDotOn : ui.homeBillDotOff]} accessibilityLabel={hasBill ? "Bill matched" : "No bill yet"}>
          {hasBill ? <Check size={15} color="#159148" strokeWidth={3.2} /> : <Plus size={15} color="#E13B48" strokeWidth={3} />}
        </View>
      </View>
    </View>
  </View>;
}

function Dashboard({
  workspace,
  loading,
  error,
  notice,
  selectedBankId,
  selectedPeriod,
  onBusiness,
  onBank,
  onPeriod,
  onDetails,
  onLongPress,
  onRefresh,
  onImport,
  onExport,
}: {
  workspace: Workspace | null;
  loading: boolean;
  error: string;
  notice: string;
  selectedBankId: string | null;
  selectedPeriod: 'This month' | 'Last month' | 'This quarter' | 'Year to date';
  onBusiness: () => void;
  onBank: () => void;
  onPeriod: () => void;
  onDetails: (id: string) => void;
  onLongPress?: (item: FinanceTransaction) => void;
  onRefresh?: () => Promise<void>;
  onImport: () => void;
  onExport: () => void;
}) {
  const refreshControl = usePullRefresh(onRefresh);
  const scopedTransactions = useMemo(() => transactionsForPeriod((workspace?.transactions ?? []).filter((item) => !selectedBankId || item.bankAccountId === selectedBankId), selectedPeriod), [workspace?.transactions, selectedBankId, selectedPeriod]);
  // Recent = what was added last for this bank (e.g. the latest CSV import), newest date first.
  // It is not limited by the period, so an imported statement always shows here.
  const recentTransactions = useMemo(() => recentlyAdded((workspace?.transactions ?? []).filter((item) => !selectedBankId || item.bankAccountId === selectedBankId), 8), [workspace?.transactions, selectedBankId]);
  const dashboard = useMemo(() => transactionSummary(scopedTransactions), [scopedTransactions]);
  const activeBusiness = workspace?.activeBusiness;
  const activeBank = workspace?.bankAccounts.find((account) => account.id === selectedBankId) ?? workspace?.bankAccounts[0];
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      contentContainerStyle={{
        padding: 16,
        paddingTop: 18,
        paddingBottom: 126,
        backgroundColor: "#F4F6FA",
      }}
    >
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        <Pressable onPress={onBusiness} style={{ flex: 1 }}>
          <Text style={ui.fieldLabel}>BUSINESS</Text>
          <View style={ui.selector}>
            <BusinessLogo business={activeBusiness} size={24} fallback={<Building2 size={18} color="#69758C" />} />
            <ContinuousMarquee text={activeBusiness?.name ?? "Loading business…"} clipStyle={ui.selectorMarqueeClip} textStyle={ui.selectorMarqueeText} />
            <ChevronDown size={18} color="#8F9AB0" />
          </View>
        </Pressable>
        <Pressable onPress={onBank} style={{ flex: 1 }}>
          <Text style={ui.fieldLabel}>BANK ACCOUNT</Text>
          <View style={ui.selector}>
            <Landmark size={18} color="#69758C" />
            <ContinuousMarquee text={activeBank ? `${activeBank.name.replace('Business Chequing', '').trim()} ${activeBank.maskedNumber}` : "No bank account"} clipStyle={ui.selectorMarqueeClip} textStyle={ui.selectorMarqueeText} />
            <ChevronDown size={18} color="#8F9AB0" />
          </View>
        </Pressable>
      </View>
      <LinearGradient colors={["#10182F", "#152344", "#2B3C82"]} start={{ x: 0, y: 0.35 }} end={{ x: 1, y: 0.65 }} style={ui.spendCard}>
        <Text style={ui.cardEyebrow}>OVERVIEW</Text>
        <Pressable onPress={onPeriod} style={ui.period}>
          <Text style={ui.periodText}>{selectedPeriod}</Text>
          <ChevronDown size={16} color="#D6DDF4" />
        </Pressable>
        <View style={ui.overviewStats}>
          <View style={[ui.overviewColumn,ui.overviewFirst]}><Text style={ui.overviewLabel}>Spent</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={ui.overviewMetric}>{money(dashboard?.spent ?? 0)}</Text></View>
          <View style={ui.overviewColumn}><Text style={ui.overviewLabel}>Categories</Text><Text style={ui.overviewMetric}>{dashboard?.categoryCount ?? 0}</Text></View>
          <View style={[ui.overviewColumn,{borderRightWidth:0}]}><Text style={ui.overviewLabel}>Bills missing</Text><Text style={[ui.overviewMetric,{color:'#FFA6B1'}]}>{dashboard?.billsMissing ?? 0}</Text></View>
        </View>
      </LinearGradient>
      <View style={ui.recentHeader}>
        <Text style={ui.recentHeading}>RECENT TRANSACTIONS</Text>
        <View style={ui.recentActions}>
          <Pressable onPress={onImport} style={ui.recentAction} accessibilityRole="button" accessibilityLabel="Import transactions from CSV">
            <Upload size={17} color="#5C70FF" strokeWidth={2.2} />
            <Text style={ui.recentActionText}>CSV</Text>
          </Pressable>
          {/* Export is hidden for now; onExport is kept so it can be shown again. */}
        </View>
      </View>
      {!!notice && <Text style={ui.homeNotice}>{notice}</Text>}
      <View style={ui.homeTransactionList}>
      {!!error && <Text style={{ color: '#D9363E', padding: 16, textAlign: 'center' }}>{error}</Text>}
      {recentTransactions.map((item, index) => <TransactionRow key={item.id} item={item} last={index === recentTransactions.length - 1} onPress={() => onDetails(item.id)} onLongPress={onLongPress} />)}
      {!recentTransactions.length && !error && (loading && !workspace ? <SkeletonRows count={5} /> : <Text style={{ color: '#71809A', padding: 20, textAlign: 'center' }}>No transactions yet.</Text>)}
      </View>
    </ScrollView>
  );
}

const ui = StyleSheet.create({
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: "#8A96AC",
    marginBottom: 7,
  },
  selector: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E6EF",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectorText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#253049" },
  selectorMarqueeClip: { flex: 1, minWidth: 0, overflow: "hidden", justifyContent: "center" },
  selectorMarqueeText: { flexShrink: 0, fontSize: 14, fontWeight: "600", color: "#253049" },
  spendCard: {
    height: 142,
    borderRadius: 25,
    padding: 18,
    position: "relative",
  },
  cardEyebrow: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: "#B2BED6",
  },
  total: { fontSize: 27, fontWeight: "700", color: "#FFF", marginTop: 7 },
  period: {
    position: "absolute",
    right: 16,
    top: 16,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#4B5A82",
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  periodText: { fontSize: 14, fontWeight: "600", color: "#FFF" },
  overviewStats: { flexDirection: "row", marginTop: 36, alignItems: "stretch" },
  overviewColumn: { flex: 1, flexBasis: 0, minHeight: 48, borderRightWidth: 1, borderColor: "#3D496D", paddingLeft: 14, justifyContent: "center" },
  overviewFirst: { paddingLeft: 0, flex: 1.2 },
  overviewLabel: { fontSize: 13, color: "#AEB9D0" },
  overviewMetric: { fontSize: 20, fontWeight: "700", color: "#FFF", marginTop: 9, lineHeight: 25 },
  recentHeader: { flexDirection: "row", alignItems: "center", marginTop: 26, marginBottom: 12 },
  recentActions: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 16 },
  recentAction: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 2 },
  recentActionText: { color: "#5C70FF", fontSize: 15, fontWeight: "700" },
  homeNotice: { color: "#4B5A78", fontSize: 13, textAlign: "center", marginBottom: 10 },
  statCard: {
    flex: 1,
    height: 100,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E6EF",
    backgroundColor: "#FFF",
    padding: 16,
  },
  warningCard: { backgroundColor: "#FFF9F0", borderColor: "#F1D7AF" },
  statLabel: { fontSize: 14, color: "#6B778E" },
  statValue: {
    fontSize: 27,
    fontWeight: "700",
    color: "#1A243A",
    marginTop: 10,
  },
  primaryAction: {
    height: 55,
    borderRadius: 17,
    backgroundColor: "#5C70FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },
  primaryActionText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  secondaryAction: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E6EF",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryText: { fontSize: 15, fontWeight: "600", color: "#202A40" },
  recentHeading: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: "#68758E",
  },
  homeTransactionList: { borderWidth: 1, borderColor: "#E2E6EF", borderRadius: 22, backgroundColor: "#FFF", overflow: "hidden" },
  homeTransactionRow: { minHeight: 72, paddingHorizontal: 20, paddingVertical: 12, flexDirection: "row", alignItems: "center" },
  linesWrap: { flex: 1, minWidth: 0 },
  // Fixed line heights keep the right column lined up exactly with the left. The first line is
  // tighter so the remark sits close to its date · category line.
  line: { flexDirection: "row", alignItems: "center", height: 26 },
  lineFirst: { height: 22 },
  lineSecond: { marginTop: 0 },
  lineLeft: { flex: 1, minWidth: 0, marginRight: 10, justifyContent: "center" },
  lineRight: { width: 112, alignItems: "flex-end", justifyContent: "center", flexShrink: 0 },
  lineAmount: { lineHeight: 22 },
  lineMeta: { color: "#8B98B0", fontSize: 14, lineHeight: 20 },
  lineBadge: { marginTop: 0 },
  homeTransactionBorder: { borderBottomWidth: 1, borderColor: "#E9EDF3" },
  homeBillIcon: { width: 48, height: 50, borderRadius: 15, backgroundColor: "#14203B", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0, alignSelf: "center" },
  homeMissingBill: { backgroundColor: "#FFF", borderWidth: 1, borderStyle: "dashed", borderColor: "#BCC8E2" },
  homePlus: { color: "#7B89A6", fontSize: 25 },
  homeCheck: { width: 18, height: 18, borderRadius: 10, backgroundColor: "#159148", borderWidth: 2, borderColor: "#FFF", position: "absolute", right: -5, bottom: -5, alignItems: "center", justifyContent: "center" },
  homeCheckText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  homeTransactionInfo: { flex: 1, minWidth: 0, minHeight: 46, marginRight: 8, justifyContent: "center" },
  homeMerchant: { color: "#1D2840", fontSize: 16, fontWeight: "700" },
  homeMerchantClip: { alignSelf: "stretch", minHeight: 22, justifyContent: "center" },
  homeMeta: { color: "#8B98B0", fontSize: 14, marginTop: 4 },
  homeAmountArea: { width: 122, minHeight: 46, alignItems: "flex-end", justifyContent: "center", flexShrink: 0, gap: 5 },
  homeAmount: { color: "#17223A", fontSize: 16, fontWeight: "800" },
  homeBillBadge: { height: 26, borderRadius: 13, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 4 },
  homeBillDot: { minWidth: 44, height: 26, borderRadius: 13, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", marginTop: 4 },
  homeBillDotOn: { backgroundColor: "#EAF6EF" },
  homeBillDotOff: { backgroundColor: "#FDEBEC" },
  homeBillBadgeAttached: { backgroundColor: "#EAF6EF" },
  homeBillBadgeMissing: { backgroundColor: "#FDEBEC" },
  homeBillBadgeText: { fontSize: 11, fontWeight: "700" },
  homeBillAttachedText: { color: "#159148" },
  homeBillMissingText: { color: "#E13B48" },
  homeBillCheck: { color: "#159148", fontSize: 12, fontWeight: "800" },
  transactionList: {
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#E2E6EF",
    overflow: "hidden",
    backgroundColor: "#FFF",
  },
  simpleTransaction: {
    minHeight: 72,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  transactionBorder: { borderBottomWidth: 1, borderColor: "#EEF1F5" },
  simpleText: { flex: 1, paddingRight: 12 },
  simpleMerchant: { fontSize: 16, fontWeight: "600", color: "#202A40" },
  simpleMeta: { fontSize: 13, color: "#8A96AC", marginTop: 3 },
  simpleAmount: { fontSize: 16, fontWeight: "600", color: "#202A40" },
});

/** Tax amount for an input: blank when there is none, so the placeholder shows. */
function taxText(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) && amount !== 0 ? amount.toFixed(2) : '';
}

/** One back button for every page: soft card with a chevron, 44px tap target. */
function BackButton({ onPress, dark = false, label = "Back" }: { onPress: () => void; dark?: boolean; label?: string }) {
  return <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}
    style={({ pressed }) => [backUi.button, dark && backUi.dark, pressed && (dark ? backUi.darkPressed : backUi.pressed)]}>
    <ArrowLeft size={22} color={dark ? "#FFF" : "#17223A"} strokeWidth={2.2} />
  </Pressable>;
}

const backUi = StyleSheet.create({
  // Round light-gray button with an arrow, used for every Back action in the app.
  button: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#ECEFF5", alignItems: "center", justifyContent: "center" },
  pressed: { backgroundColor: "#DDE2EC", transform: [{ scale: 0.95 }] },
  dark: { backgroundColor: "rgba(255,255,255,0.14)" },
  darkPressed: { backgroundColor: "rgba(255,255,255,0.22)", transform: [{ scale: 0.95 }] },
});

const SUCCESS_MESSAGE_MS = 3500;

/** Clears a success message after a few seconds; errors stay until the user acts. */
function useAutoClear(show: boolean, key: unknown, clear: () => void, ms = SUCCESS_MESSAGE_MS) {
  const clearRef = useRef(clear);
  clearRef.current = clear;
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => clearRef.current(), ms);
    return () => clearTimeout(timer);
  }, [show, key, ms]);
}

/** Full-screen photo: pinch to zoom, drag when zoomed, double-tap to zoom in/out. */
function ImageViewer({ uri, onClose, footer }: { uri: string; onClose: () => void; footer?: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const view = useRef({ scale: 1, x: 0, y: 0, pinchStart: 0, scaleStart: 1, panX: 0, panY: 0, moved: false, lastTap: 0 });
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const show = (animated: boolean) => {
    const v = view.current;
    // Keep the zoomed photo from being dragged completely off screen.
    v.x = clamp(v.x, -width * (v.scale - 1) / 2, width * (v.scale - 1) / 2);
    v.y = clamp(v.y, -height * (v.scale - 1) / 2, height * (v.scale - 1) / 2);
    if (animated) {
      Animated.parallel([
        Animated.spring(scale, { toValue: v.scale, useNativeDriver: true, friction: 7 }),
        Animated.spring(translateX, { toValue: v.x, useNativeDriver: true, friction: 7 }),
        Animated.spring(translateY, { toValue: v.y, useNativeDriver: true, friction: 7 }),
      ]).start();
    } else {
      scale.setValue(v.scale); translateX.setValue(v.x); translateY.setValue(v.y);
    }
  };
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      const v = view.current;
      v.moved = false; v.pinchStart = 0; v.panX = v.x; v.panY = v.y;
    },
    onPanResponderMove: (event, gesture) => {
      const v = view.current;
      const touches = event.nativeEvent.touches;
      if (touches.length >= 2) {
        const distance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
        if (!v.pinchStart) { v.pinchStart = distance; v.scaleStart = v.scale; }
        else v.scale = clamp(v.scaleStart * distance / v.pinchStart, 1, 5);
        v.moved = true;
      } else {
        // After a pinch ends, continue dragging from where the photo is now.
        if (v.pinchStart) { v.pinchStart = 0; v.panX = v.x - gesture.dx; v.panY = v.y - gesture.dy; }
        if (v.scale > 1) { v.x = v.panX + gesture.dx; v.y = v.panY + gesture.dy; }
        if (Math.abs(gesture.dx) + Math.abs(gesture.dy) > 8) v.moved = true;
      }
      show(false);
    },
    onPanResponderRelease: () => {
      const v = view.current;
      if (!v.moved) {
        const now = Date.now();
        if (now - v.lastTap < 350) { v.scale = v.scale > 1.05 ? 1 : 2.5; v.x = 0; v.y = 0; v.lastTap = 0; }
        else v.lastTap = now;
      }
      if (v.scale < 1.05) { v.scale = 1; v.x = 0; v.y = 0; }
      show(true);
    },
  })).current;
  return <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <View style={viewerUi.backdrop}>
      <Animated.View style={[viewerUi.stage, { transform: [{ translateX }, { translateY }, { scale }] }]} {...responder.panHandlers}>
        <LoadingImage uri={uri} style={viewerUi.image} resizeMode="contain" dark />
      </Animated.View>
      <Pressable onPress={onClose} style={viewerUi.close} hitSlop={10} accessibilityLabel="Close photo"><Text style={viewerUi.closeText}>×</Text></Pressable>
      <Text pointerEvents="none" style={viewerUi.hint}>Pinch to zoom · double-tap to zoom in or out</Text>
      {footer}
    </View>
  </Modal>;
}

const viewerUi = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#000" },
  stage: { flex: 1, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  hint: { position: "absolute", bottom: 36, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: 13 },
  close: { position: "absolute", top: 48, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  closeText: { color: "#FFF", fontSize: 30, lineHeight: 32, marginTop: -2 },
});

/** Camera files are named with random codes; show something readable instead. */
function readableBillName(name?: string | null) {
  if (!name) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(name) ? (/\.pdf$/i.test(name) ? 'Bill (PDF)' : 'Bill photo') : name;
}

function TransactionDetails({ transaction, token, onChanged, onBack, openCategory = false, onCategoryOpened }: { openCategory?: boolean; onCategoryOpened?: () => void; transaction?: FinanceTransaction; token: string; onChanged: () => void; onBack: () => void }) {
  const [sheet,setSheet]=useState(openCategory ? 'category' : ''); const [loadingBills,setLoadingBills]=useState(false);
  useEffect(() => { if (openCategory) onCategoryOpened?.(); }, []); const [category,setCategory]=useState(transaction?.category ?? 'Uncategorized'); const [categoryOptions,setCategoryOptions]=useState<string[]>([]); const [loadingCategories,setLoadingCategories]=useState(false); const [previewLoading,setPreviewLoading]=useState(false); const [memo,setMemo]=useState(transaction?.memo ?? ''); const [gst,setGst]=useState(taxText(transaction?.gst)); const [pst,setPst]=useState(taxText(transaction?.pst)); const [gstAtFivePercent,setGstAtFivePercent]=useState(false); const [pendingBill,setPendingBill]=useState<{ uri: string; name: string; mimeType?: string | null } | null>(null); const [availableBills,setAvailableBills]=useState<AvailableBill[]>([]); const [selectedExistingBillId,setSelectedExistingBillId]=useState(''); const [previewUri,setPreviewUri]=useState(''); const [previewError,setPreviewError]=useState(''); const [saving,setSaving]=useState(false); const [message,setMessage]=useState('');
  const fivePercentGst = Math.abs(Number(transaction?.amount ?? 0)) * 0.05;
  useEffect(() => { const transactionCategory = transaction?.category?.trim() || 'Uncategorized'; setCategory(transactionCategory); setMemo(transaction?.memo ?? ''); setGst(taxText(transaction?.gst)); setPst(taxText(transaction?.pst)); setGstAtFivePercent(fivePercentGst > 0 && Math.abs(Number(transaction?.gst ?? 0) - fivePercentGst) < 0.01); setPendingBill(null); setSelectedExistingBillId(''); setMessage(''); }, [transaction?.id]);
  useEffect(() => { if (!token || !transaction?.businessId) { setCategoryOptions([]); return; } setLoadingCategories(true); void getCategories(token, transaction.businessId).then(({ categories }) => setCategoryOptions(categories)).catch(() => setCategoryOptions([])).finally(() => setLoadingCategories(false)); }, [token, transaction?.businessId]);
  const [savingCategory, setSavingCategory] = useState(false);
  const [billSource, setBillSource] = useState(false);
  // Like OATRx, a category is saved as soon as it is picked or typed in.
  const chooseCategory = async (next: string) => {
    setSheet('');
    const value = next.trim() || 'Uncategorized';
    if (!transaction || value === category) return;
    const previous = category;
    setCategory(value);
    setSavingCategory(true);
    try {
      const { transaction: saved } = await updateTransaction(token, transaction.id, { category: value });
      setCategory(saved.category);
      setCategoryOptions((options) => options.some((item) => item.toLowerCase() === saved.category.toLowerCase()) ? options : [...options, saved.category].sort((a, b) => a.localeCompare(b)));
      setMessage(`Category saved as ${saved.category}.`);
      await onChanged();
    } catch (error) {
      setCategory(previous);
      setMessage(error instanceof Error ? error.message : 'Unable to save the category.');
    } finally { setSavingCategory(false); }
  };
  const pickBillImage = async (source: 'camera' | 'gallery') => {
    setBillSource(false);
    if (!(await requestBillMediaPermission(source))) { setMessage(`Allow ${source === 'camera' ? 'camera' : 'photo library'} access to add a bill.`); return; }
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPendingBill({ uri: asset.uri, name: asset.fileName ?? `bill-${Date.now()}.jpg`, mimeType: asset.mimeType ?? 'image/jpeg' });
    setSelectedExistingBillId('');
    setMessage('Bill ready to save to this transaction.');
  };
  useEffect(() => { if (!transaction || !token || transaction.billStatus === 'attached') { setAvailableBills([]); return; } setLoadingBills(true); void getAvailableBills(token, transaction.businessId, transaction.bankAccountId).then(({ bills }) => setAvailableBills(bills)).catch(() => setAvailableBills([])).finally(() => setLoadingBills(false)); }, [token, transaction?.id, transaction?.businessId, transaction?.bankAccountId, transaction?.billStatus]);
  useEffect(() => {
    if (pendingBill) { setPreviewUri(''); setPreviewError(''); return; }
    const selectedBill = availableBills.find((bill) => bill.id === selectedExistingBillId);
    const target = selectedBill?.mimeType?.startsWith('image/')
      ? { url: billFileUrl(selectedBill.id), key: selectedBill.id, mimeType: selectedBill.mimeType }
      : !selectedExistingBillId && transaction?.billStatus === 'attached' && transaction.billMimeType?.startsWith('image/')
        ? { url: transactionBillFileUrl(transaction.id), key: transaction.id, mimeType: transaction.billMimeType }
        : null;
    if (!target) { setPreviewUri(''); setPreviewError(''); setPreviewLoading(false); return; }
    let cancelled = false;
    setPreviewUri(''); setPreviewError(''); setPreviewLoading(true);
    void downloadBillPreview(token, target.url, target.key, target.mimeType)
      .then((uri) => { if (!cancelled) setPreviewUri(uri); })
      .catch(() => { if (!cancelled) setPreviewError('The bill image could not be loaded.'); })
      .finally(() => { if (!cancelled) setPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [token, transaction?.id, transaction?.billStatus, transaction?.billMimeType, pendingBill, availableBills, selectedExistingBillId]);
  const chooseBill = () => setBillSource(true);
  const save = async () => { if (!transaction || !token) return; const parsedGst = Number(gst.trim() || 0); const parsedPst = Number(pst.trim() || 0); if (!Number.isFinite(parsedGst) || !Number.isFinite(parsedPst)) { setMessage('GST and PST must be valid amounts.'); return; } setSaving(true); setMessage(''); try { await updateTransaction(token, transaction.id, { category, memo, gst: parsedGst, pst: parsedPst }); if (pendingBill) await uploadBill(token, transaction.id, pendingBill); else if (selectedExistingBillId) await attachExistingBill(token, transaction.id, selectedExistingBillId); await onChanged(); const matched = !!pendingBill || !!selectedExistingBillId; setPendingBill(null); setSelectedExistingBillId(''); setMessage(matched ? 'Bill attached to this transaction.' : 'Changes saved.'); } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to save changes.'); } finally { setSaving(false); } };
  const attached = transaction?.billStatus === 'attached';
  const aiMatched = transaction?.billMappedBy === 'AI';
  const [viewerUri, setViewerUri] = useState('');
  useBackHandler(!!sheet || billSource, () => { setSheet(''); setBillSource(false); });
  const messageIsSuccess = /ready|saved|attached/i.test(message);
  useMessageHaptic(/ready/i.test(message) ? '' : message, !messageIsSuccess);
  useAutoClear(!!message && messageIsSuccess, message, () => setMessage(''));
  // Lift the page above the tab bar while a sheet is open so the sheet is not covered.
  return (
    <View style={[{flex:1,backgroundColor:'#F4F6FA'}, (!!sheet || billSource) && { zIndex: 20, elevation: 20 }]}><ScrollView contentContainerStyle={detail.screen}>
      <View style={detail.header}>
        <BackButton onPress={onBack} />
        <Text style={detail.title}>Transaction details</Text>
      </View>
      <LinearGradient colors={['#111A32','#17264C','#2B3C82']} start={{x:0,y:0.25}} end={{x:1,y:0.75}} style={detail.summaryCard}>
        <View style={detail.summaryTop}><Text numberOfLines={1} style={detail.summaryMeta}>{transaction?.postedLabel ?? ''} · {transaction?.bankAccountNumber ?? 'No account'}</Text><View style={[detail.summaryBadge, !attached && { backgroundColor: '#502433' }]}>{attached && <Text style={detail.summaryCheck}>✓</Text>}<Text style={detail.summaryBadgeText}>{attached ? 'Bill attached' : 'Bill missing'}</Text></View></View>
        <Text style={detail.summaryAmount}>{money(transaction?.amount ?? 0)}</Text>
        <SummaryMarquee text={transaction?.merchant ?? 'Transaction'} style={detail.summaryMerchant} />
        <SummaryMarquee text={transaction?.description ?? ''} style={detail.summaryRemark} scrollAfter={42} />
      </LinearGradient>
      <Text style={detail.sectionTitle}>EDIT DETAILS</Text>
      <View style={detail.panel}>
        <View style={detail.fieldPair}><View style={detail.field}><Text style={detail.label}>GST</Text><View style={detail.taxInput}><TextInput value={gst} placeholder="GST" placeholderTextColor="#9AA6BD" onChangeText={(value) => { setGst(value); setGstAtFivePercent(false); }} keyboardType="decimal-pad" style={detail.taxValue}/><Pressable onPress={() => { const enabled = !gstAtFivePercent; setGstAtFivePercent(enabled); if (enabled) setGst(fivePercentGst.toFixed(2)); }} style={detail.taxToggle}><View style={[detail.taxCheckbox, gstAtFivePercent && detail.taxCheckboxSelected]}>{gstAtFivePercent && <Text style={detail.taxCheckmark}>✓</Text>}</View><Text style={detail.taxToggleText}>5%</Text></Pressable></View></View><View style={detail.field}><Text style={detail.label}>PST</Text><TextInput value={pst} onChangeText={setPst} placeholder="PST" placeholderTextColor="#9AA6BD" keyboardType="decimal-pad" style={detail.input}/></View></View>
        <View style={detail.fieldPair}><View style={detail.field}><Text style={detail.label}>Category</Text><Pressable onPress={()=>setSheet('category')} disabled={savingCategory} style={[detail.input,detail.selectInput]}><Text numberOfLines={1} style={[detail.value, { flex: 1 }]}>{category}</Text>{savingCategory ? <ActivityIndicator size="small" color="#5C70FF" /> : <ChevronDown size={18} color="#8A96AC" />}</Pressable></View><View style={detail.field}><Text style={detail.label}>Memo</Text><TextInput value={memo} onChangeText={setMemo} placeholder="Type / for options" placeholderTextColor="#9AA6BD" style={detail.input}/></View></View>
        {memo.endsWith('/') && <View style={detail.memoMenu}>{MEMO_SHORTCUTS.map((item) => <Pressable key={item} onPress={() => setMemo(item)} style={detail.memoOption}><Text style={detail.memoOptionText}>{item}</Text></Pressable>)}</View>}
      </View>
      <View style={detail.billPanel}>
        <Text style={detail.billTitle}>Bill</Text>
        {attached && !pendingBill && !!transaction?.billMappedBy && <View style={[detail.mapStamp, aiMatched && detail.mapStampAi]}>
          <View style={[detail.mapStampIcon, aiMatched && detail.mapStampIconAi]}>{aiMatched ? <Sparkles size={20} color="#FFF" /> : <Text style={detail.mapStampCheck}>✓</Text>}</View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[detail.mapStampLabel, aiMatched && detail.mapStampLabelAi]}>{aiMatched ? 'AUTO-MATCHED' : 'MATCHED'}</Text>
            <Text style={[detail.mapStampTitle, aiMatched && detail.mapStampTitleAi]}>{aiMatched ? 'Matched automatically by System' : `Matched by ${transaction.billMappedBy}`}</Text>
            {!!transaction.billMappedAt && <Text numberOfLines={1} style={detail.mapStampSub}>{new Date(transaction.billMappedAt).toLocaleString('en-CA', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</Text>}
          </View>
        </View>}
        <Pressable onPress={chooseBill} style={detail.billFile}><View style={detail.fileIcon}><FileText size={28} color="#A2AECB" /></View><View style={detail.fileInfo}><Text numberOfLines={1} style={detail.fileName}>{pendingBill?.name ?? readableBillName(transaction?.billName) ?? 'Upload bill'}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={detail.fileMeta}>{pendingBill ? 'Ready to save to this transaction only' : transaction?.billSizeBytes ? `${Math.round(transaction.billSizeBytes / 1024)} KB · Uploaded by ${transaction.billUploadedBy ?? 'you'}` : 'Take a photo or choose from gallery'}</Text></View>{!(attached && aiMatched && !pendingBill) && <View style={[detail.fileBadge, !attached && { backgroundColor: '#FDEBEC' }, attached && aiMatched && !pendingBill && { backgroundColor: '#EFEAFE' }]}>{attached && !pendingBill && (aiMatched ? <Sparkles size={14} color="#6D4AE0" /> : <Text style={detail.fileCheck}>✓</Text>)}<Text style={[detail.fileBadgeText, (!attached || pendingBill) && { color: '#D9363E' }, attached && aiMatched && !pendingBill && { color: '#6D4AE0' }]}>{pendingBill ? 'Ready' : attached ? (aiMatched ? 'AI matched' : 'Matched') : 'Upload'}</Text></View>}</Pressable>
        {!attached && loadingBills && !availableBills.length && <BillOptionsSkeleton />}
        {!attached && availableBills.length > 0 && <>
          <Text style={detail.thumbHeading}>Uploaded bills · tap one to attach</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={detail.thumbRow}>
            {availableBills.map((bill) => {
              const chosen = selectedExistingBillId === bill.id;
              return <Pressable key={bill.id} onPress={() => { setSelectedExistingBillId(chosen ? '' : bill.id); setPendingBill(null); setMessage(chosen ? '' : 'Existing bill ready to save to this transaction.'); }}
                style={[detail.thumb, chosen && detail.thumbOn]} accessibilityRole="imagebutton" accessibilityState={{ selected: chosen }} accessibilityLabel={billHeadline(bill)}>
                {bill.mimeType.startsWith('image/')
                  ? <AuthImage token={token} url={billFileUrl(bill.id)} cacheKey={`thumb-${bill.id}`} style={detail.thumbImage} />
                  : <View style={[detail.thumbImage, detail.thumbPdf]}><FileText size={26} color="#8A96AD" /><Text style={detail.thumbPdfText}>PDF</Text></View>}
                {chosen && <View style={detail.thumbTick}><Check size={13} color="#FFF" strokeWidth={3.5} /></View>}
              </Pressable>;
            })}
          </ScrollView>
        </>}
        {pendingBill?.mimeType?.startsWith('image/') && <Pressable onPress={() => setViewerUri(pendingBill.uri)} accessibilityRole="imagebutton" accessibilityLabel="View bill photo"><LoadingImage uri={pendingBill.uri} style={detail.billPreview} resizeMode="contain" /><Text style={detail.previewHint}>Tap photo to view full screen</Text></Pressable>}{!pendingBill && !!previewUri && <Pressable onPress={() => setViewerUri(previewUri)} accessibilityRole="imagebutton" accessibilityLabel="View bill photo"><LoadingImage uri={previewUri} style={detail.billPreview} resizeMode="contain" /><Text style={detail.previewHint}>Tap photo to view full screen</Text></Pressable>}{!pendingBill && !!previewError && <Text style={detail.previewError}>{previewError}</Text>}{!pendingBill && previewLoading && !previewUri && <ImageSkeleton height={220} style={{ marginTop: 12 }} />}
      </View>
      {!!message && <Text style={{ color: messageIsSuccess ? '#159148' : '#D9363E', textAlign: 'center', fontWeight: '700', marginTop: 14 }}>{message}</Text>}
      <Pressable onPress={save} disabled={saving || !transaction} style={[detail.save, (!transaction || saving) && { opacity: 0.55 }]}><Text style={detail.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text></Pressable>
    </ScrollView>{sheet==='category'&&<CategorySheet loading={loadingCategories && !categoryOptions.length} options={categoryOptions} selected={category} onChoose={(value) => void chooseCategory(value)} onClose={()=>setSheet('')}/>}{!!viewerUri&&<ImageViewer uri={viewerUri} onClose={() => setViewerUri('')} />}{billSource&&<UploadOptionsSheet subtitle="Add a bill to this transaction" onClose={() => setBillSource(false)} onCamera={() => void pickBillImage('camera')} onGallery={() => void pickBillImage('gallery')} />}</View>
  );
}
function billHeadline(bill: AvailableBill) {
  if (bill.aiStatus === 'done' && bill.billTotal != null) return `${bill.billVendor ?? 'Bill'} · ${money(bill.billTotal)}`;
  return bill.mimeType.startsWith('image/') ? 'Uploaded photo available' : 'Uploaded bill available';
}

function billSubline(bill: AvailableBill) {
  const by = `Uploaded by ${bill.uploadedBy}`;
  if (bill.aiStatus === 'done' && bill.billDate) {
    const date = new Date(`${bill.billDate}T00:00:00`).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
    const taxes = [bill.billGst != null ? `GST ${money(bill.billGst)}` : '', bill.billPst != null ? `PST ${money(bill.billPst)}` : ''].filter(Boolean).join(' · ');
    return [date, taxes, by].filter(Boolean).join(' · ');
  }
  if (bill.aiStatus === 'pending' || bill.aiStatus === 'processing') return `Reading bill… · ${by}`;
  return bill.mimeType.startsWith('image/') ? `Tap to preview and attach · ${by}` : `${bill.fileName} · ${by}`;
}

const MEMO_SHORTCUTS = ['Utilities', 'College fee payout', 'Lease Payment', 'Western Union Payout'];

/** Pick a category or type a new one (like OATRx's "Select or create category"). */
function CategorySheet({ options, selected, onChoose, onClose, loading = false }: { loading?: boolean; options: string[]; selected: string; onChoose: (value: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  // The app draws under the keyboard, so move the sheet up by the keyboard height.
  const [keyboardSpace, setKeyboardSpace] = useState(0);
  const { height: windowHeight } = useWindowDimensions();
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => setKeyboardSpace(event.endCoordinates.height / UI_SCALE));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardSpace(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const listHeight = keyboardSpace ? Math.max(140, windowHeight / UI_SCALE - keyboardSpace - 330) : 420;
  const typed = query.trim().replace(/\s+/g, ' ');
  const list = useMemo(() => {
    const all = options.some((item) => item.toLowerCase() === selected.toLowerCase()) ? options : [selected, ...options];
    return typed ? all.filter((item) => item.toLowerCase().includes(typed.toLowerCase())) : all;
  }, [options, selected, typed]);
  const exists = !!typed && [...options, selected].some((item) => item.toLowerCase() === typed.toLowerCase());
  return <View style={s.overlay}>
    <Pressable style={s.overlayTap} onPress={onClose} />
    <SlideUpSheet onClose={onClose} style={[detail.sheet, keyboardSpace ? { marginBottom: keyboardSpace, paddingBottom: 12 } : null]}>
      <View style={s.handle} />
      <View style={detail.sheetHead}><Text style={detail.sheetTitle}>Category</Text><Pressable style={[s.close, { marginLeft: 'auto' }]} onPress={onClose}><Text style={s.closeText}>×</Text></Pressable></View>
      <View style={detail.categorySearch}>
        <Search size={18} color="#8A96AC" />
        <TextInput value={query} onChangeText={setQuery} placeholder="Select or type a new category" placeholderTextColor="#9AA6BD" autoCorrect={false} returnKeyType="done" onSubmitEditing={() => { if (typed) onChoose(exists ? list.find((item) => item.toLowerCase() === typed.toLowerCase()) ?? typed : typed); }} style={detail.categorySearchInput} />
        {!!query && <Pressable onPress={() => setQuery('')} hitSlop={10}><Text style={detail.categoryClear}>×</Text></Pressable>}
      </View>
      <ScrollView style={[detail.categoryList, { maxHeight: listHeight }]} keyboardShouldPersistTaps="handled">
        {!!typed && !exists && <Pressable onPress={() => onChoose(typed)} style={[detail.sheetRow, detail.categoryCreate]}><Plus size={18} color="#5C70FF" /><Text style={detail.categoryCreateText}>Add “{typed}”</Text></Pressable>}
        {list.map((item) => <Pressable key={item} onPress={() => onChoose(item)} style={[detail.sheetRow, item === selected && detail.sheetSelected]}><Text style={detail.sheetName}>{item}</Text>{item === selected && <Text style={[s.check, { marginLeft: 'auto' }]}>✓</Text>}</Pressable>)}
        {loading && !typed && <SheetRowsSkeleton count={6} />}
        {!loading && !list.length && !typed && <Text style={detail.categoryEmpty}>No categories yet.</Text>}
        {selected !== 'Uncategorized' && !typed && <Pressable onPress={() => onChoose('Uncategorized')} style={detail.sheetRow}><Text style={detail.categoryClearText}>Clear category</Text></Pressable>}
      </ScrollView>
    </SlideUpSheet>
  </View>;
}

function DetailSheet({title,items,selected,onChoose,close}:{title:string,items:string[],selected:string,onChoose:(x:string)=>void,close:()=>void}){return <View style={s.overlay}><Pressable style={s.overlayTap} onPress={close}/><SlideUpSheet onClose={close} style={detail.sheet} scrollable><View style={s.handle}/><View style={detail.sheetHead}><Text style={detail.sheetTitle}>{title}</Text><Pressable style={s.close} onPress={close}><Text style={s.closeText}>×</Text></Pressable></View>{items.map(x=><Pressable key={x} onPress={()=>onChoose(x.split('\n')[0])} style={[detail.sheetRow,x===selected&&detail.sheetSelected]}><Text style={detail.sheetName}>{x.split('\n')[0]}</Text>{x.includes('\n')&&<Text style={detail.sheetSub}>{x.split('\n')[1]}</Text>}{x===selected&&<Text style={s.check}>✓</Text>}</Pressable>)}</SlideUpSheet></View>}
const detail = StyleSheet.create({
  detailRow:{minHeight:56,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1,borderColor:'#E9EDF3'},rowLabel:{width:100,flexShrink:0},rowValue:{fontSize:16,fontWeight:'700',color:'#1D2840'},missing:{marginLeft:'auto',backgroundColor:'#FDEBEC',color:'#E13B48',paddingHorizontal:10,paddingVertical:5,borderRadius:14,fontSize:12,fontWeight:'700'},remarks:{flex:1,fontSize:14,color:'#1D2840'},bank:{fontSize:13,color:'#8290A8',marginTop:3},fieldPair:{flexDirection:'row',gap:16,padding:16,borderBottomWidth:1,borderColor:'#E9EDF3'},field:{flex:1,minWidth:0},input:{height:50,borderRadius:14,borderWidth:1,borderColor:'#E2E6EF',backgroundColor:'#FFF',paddingHorizontal:12,justifyContent:'center',fontSize:15,color:'#1D2840'},selectInput:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},sheet:{backgroundColor:'#FFF',borderTopLeftRadius:32,borderTopRightRadius:32,paddingHorizontal:20,paddingTop:14,paddingBottom:22},sheetHead:{flexDirection:'row',alignItems:'center',marginBottom:14},sheetTitle:{fontSize:22,fontWeight:'800',color:'#17223A'},sheetRow:{minHeight:66,borderRadius:18,borderWidth:1,borderColor:'#E1E6EF',paddingHorizontal:16,paddingVertical:11,marginBottom:8,justifyContent:'center'},sheetSelected:{borderColor:'#5C70FF',backgroundColor:'#F7F8FF'},sheetName:{fontSize:16,fontWeight:'700',color:'#17223A'},sheetSub:{fontSize:14,color:'#71809A',marginTop:2},
  taxInput:{height:50,borderRadius:14,borderWidth:1,borderColor:'#E2E6EF',backgroundColor:'#FFF',flexDirection:'row',alignItems:'center',paddingLeft:12},taxValue:{flex:1,height:'100%',fontSize:15,color:'#1D2840'},taxToggle:{height:'100%',paddingHorizontal:10,flexDirection:'row',alignItems:'center',gap:6},taxCheckbox:{height:22,width:22,borderRadius:6,borderWidth:1.5,borderColor:'#C7D0E1',alignItems:'center',justifyContent:'center'},taxCheckboxSelected:{backgroundColor:'#5C70FF',borderColor:'#5C70FF'},taxCheckmark:{color:'#FFF',fontWeight:'900',fontSize:13},taxToggleText:{fontSize:15,color:'#5E6B83',fontWeight:'700'},
  screen: { padding: 16, paddingTop: 18, paddingBottom: 148, backgroundColor: "#F4F6FA" },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  back: {
    height: 42,
    width: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E0E5EF",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 27, color: "#253049", marginTop: -4 },
  title: { fontSize: 25, fontWeight: "800", color: "#17223A", marginLeft: 12 },
  summaryCard: { minHeight: 196, borderRadius: 28, padding: 20, marginBottom: 24, overflow: "hidden" },
  summaryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryMeta: { flex: 1, minWidth: 0, fontSize: 13, color: "#C8D1E9", fontWeight: "500", marginRight: 8 },
  summaryBadge: { height: 36, borderRadius: 18, paddingHorizontal: 11, backgroundColor: "#315B73", flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  summaryCheck: { color: "#6AF0A0", fontSize: 15, fontWeight: "800" },
  summaryBadgeText: { color: "#73F1A4", fontSize: 13, fontWeight: "700" },
  summaryAmount: { color: "#FFF", fontSize: 40, lineHeight: 47, fontWeight: "800", marginTop: 14, letterSpacing: -0.5 },
  summaryMerchant: { color: "#FFF", fontSize: 19, lineHeight: 24, fontWeight: "800", marginTop: 7 },
  summaryRemark: { color: "#BBC6E1", fontSize: 13, lineHeight: 18, marginTop: 4 },
  sectionTitle: { color: "#8390A8", fontSize: 13, fontWeight: "700", letterSpacing: 1.2, marginLeft: 8, marginBottom: 12 },
  amountCard: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E6EF",
    borderRadius: 20,
    padding: 0,
    overflow: "hidden",
    marginBottom: 12,
  },
  amount: { fontSize: 30, fontWeight: "800", color: "#1D2840" },
  muted: { fontSize: 16, color: "#748098", marginTop: 12 },
  merchant: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E2940",
    marginTop: 22,
  },
  panel: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E6EF",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
  },
  line: {
    minHeight: 76,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#E9EDF3",
  },
  label: { fontSize: 15, color: "#64728A", fontWeight: "600", marginBottom: 8 },
  value: { fontSize: 16, fontWeight: "600", color: "#202A40" },
  mutedInput: { color: "#9AA6BD" },
  taxRate: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
  taxBox: { height: 18, width: 18, borderRadius: 5, borderWidth: 2, borderColor: "#BEC8DC" },
  taxText: { color: "#64728A", fontSize: 14, fontWeight: "600" },
  tax: { flexDirection: "row", gap: 9, alignItems: "center" },
  taxAmount: {
    minWidth: 142,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E6EF",
    backgroundColor: "#F8F9FC",
    fontSize: 16,
    fontWeight: "600",
    color: "#202A40",
    textAlign: "right",
  },
  rate: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E6EF",
    fontSize: 16,
    fontWeight: "700",
    color: "#5C70FF",
  },
  memoArea: { padding: 20 },
  memo: {
    marginTop: 11,
    minHeight: 62,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E6EF",
    backgroundColor: "#F8F9FC",
    padding: 16,
    justifyContent: "center",
  },
  memoText: { fontSize: 16, color: "#253049" },
  billPanel: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E6EF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  billHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  billTitle: { fontSize: 16, fontWeight: "700", color: "#17223A" },
  billFile: { height: 104, borderRadius: 20, borderWidth: 1, borderColor: "#E1E6EF", backgroundColor: "#F8FAFD", padding: 10, marginTop: 14, flexDirection: "row", alignItems: "center" },
  fileIcon: { height: 70, width: 56, borderRadius: 12, borderWidth: 1, borderColor: "#E1E6EF", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  fileInfo: { flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 },
  fileName: { color: "#17223A", fontSize: 16, fontWeight: "800" },
  fileMeta: { color: "#71809A", fontSize: 13, marginTop: 4 },
  fileBadge: { height: 34, borderRadius: 17, backgroundColor: "#E0F1E7", paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
  fileCheck: { color: "#159148", fontSize: 15, fontWeight: "800" },
  fileBadgeText: { color: "#159148", fontSize: 14, fontWeight: "700" },
  attached: { fontSize: 14, fontWeight: "600", color: "#159148" },
  bill: {
    height: 200,
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D6DDEA",
    backgroundColor: "#F8F9FC",
    alignItems: "center",
    justifyContent: "center",
  },
  billName: { marginTop: 12, fontSize: 14, color: "#7B879F" },
  uploadBill: {
    height: 48,
    marginTop: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#AFBAFF",
    backgroundColor: "#F7F8FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },
  uploadBillText: { color: "#5C70FF", fontSize: 16, fontWeight: "700" },
  save: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#5C70FF",
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  billPreview: { width: '100%', height: 180, marginTop: 12, borderRadius: 14, backgroundColor: '#EDF1F7' },
  previewError: { color: '#D9363E', textAlign: 'center', marginTop: 12, fontWeight: '700' },
  thumbHeading: { color: '#5B6882', fontSize: 13, fontWeight: '700', marginTop: 14, marginBottom: 8 },
  thumbRow: { gap: 10, paddingRight: 4 },
  thumb: { width: 92, height: 112, borderRadius: 14, borderWidth: 2, borderColor: '#E1E6EF', overflow: 'hidden', backgroundColor: '#F1F3F8' },
  thumbOn: { borderColor: '#16A34A' },
  thumbImage: { width: '100%', height: '100%' },
  thumbPdf: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  thumbPdfText: { color: '#8A96AD', fontSize: 12, fontWeight: '800' },
  thumbTick: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#16A34A', borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  availableBill: { marginTop: 10, minHeight: 72, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#DDE4F0', backgroundColor: '#F9FAFD', flexDirection: 'row', alignItems: 'center' },
  availableBillSelected: { borderColor: '#5C70FF', borderWidth: 2, backgroundColor: '#F2F4FF' },
  availableBillTitle: { color: '#17223A', fontWeight: '800', marginBottom: 4 },
  availableBillPreview: { width: 100, height: 66, borderRadius: 9, marginTop: 8, backgroundColor: '#E9EDF3' },
  previewHint: { color: '#8A96AC', fontSize: 12, textAlign: 'center', marginTop: 6 },
  mapStamp: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#EAF6EF', borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#9ED4B2' },
  mapStampAi: { backgroundColor: '#F4F0FF', borderColor: '#B9A6F5' },
  mapStampLabel: { color: '#159148', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  mapStampLabelAi: { color: '#7C5CE6' },
  mapStampIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#159148', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#CDEBD8' },
  mapStampIconAi: { backgroundColor: '#6D4AE0', borderColor: '#DCD2FB' },
  mapStampCheck: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  mapStampTitle: { color: '#0F6B36', fontSize: 16, fontWeight: '800', marginTop: 2 },
  mapStampTitleAi: { color: '#4B2EB8' },
  mapStampSub: { color: '#6B778F', fontSize: 12, marginTop: 3 },
  memoMenu: { marginHorizontal: 16, marginBottom: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E2E6EF', backgroundColor: '#FFF', overflow: 'hidden' },
  memoOption: { paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EEF1F6' },
  memoOptionText: { fontSize: 15, color: '#17223A', fontWeight: '600' },
  categorySearch: { height: 50, borderRadius: 14, borderWidth: 1, borderColor: '#E2E6EF', backgroundColor: '#F8F9FC', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginBottom: 8 },
  categorySearchInput: { flex: 1, height: '100%', fontSize: 16, color: '#17223A' },
  categoryClear: { fontSize: 22, color: '#8A96AC', paddingHorizontal: 4 },
  categoryList: { maxHeight: 420 },
  categoryCreate: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryCreateText: { fontSize: 16, fontWeight: '700', color: '#5C70FF' },
  categoryEmpty: { textAlign: 'center', color: '#8A96AC', paddingVertical: 20 },
  categoryClearText: { fontSize: 15, fontWeight: '700', color: '#D9363E' },
});

function UploadBill({ token, workspace, transactions, selectedBankId, preferredTransactionId, initialFile, onChooseMedia, onBack, onSaved }: { token: string; workspace: Workspace | null; transactions: FinanceTransaction[]; selectedBankId: string | null; preferredTransactionId: string | null; initialFile: { uri: string; name: string; mimeType?: string | null } | null; onChooseMedia: (source: 'camera' | 'gallery') => void; onBack: () => void; onSaved: (transactionId: string) => void }) {
  const missing = transactions.filter((item) => item.billStatus === 'missing');
  const [transactionId, setTransactionId] = useState(preferredTransactionId ?? missing[0]?.id ?? '');
  const [file, setFile] = useState<{ uri: string; name: string; mimeType?: string | null } | null>(null);
  const [availableBills, setAvailableBills] = useState<AvailableBill[]>([]); const [selectedBillId, setSelectedBillId] = useState(''); const [loadingBills, setLoadingBills] = useState(false);
  const [saving, setSaving] = useState(false); const [message, setMessage] = useState('');
  useAutoClear(message.includes('matched'), message, () => setMessage(''));
  const chooseFile = async () => { const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png'], copyToCacheDirectory: true }); if (!result.canceled) { const asset = result.assets[0]; setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType }); setSelectedBillId(''); setMessage(''); } };
  useEffect(() => { if (initialFile) { setFile(initialFile); setSelectedBillId(''); } }, [initialFile]);
  useEffect(() => { if (preferredTransactionId) setTransactionId(preferredTransactionId); }, [preferredTransactionId]);
  useEffect(() => { if (!workspace?.activeBusiness || !token || !selectedBankId) return; setLoadingBills(true); void getAvailableBills(token, workspace.activeBusiness.id, selectedBankId).then(({ bills }) => setAvailableBills(bills)).catch(() => setAvailableBills([])).finally(() => setLoadingBills(false)); }, [token, workspace?.activeBusiness?.id, selectedBankId]);
  const save = async () => { if (!file && !selectedBillId) { setMessage('Choose a bill to match first.'); return; } if (!transactionId) { setMessage('Select the transaction that this bill belongs to.'); return; } setSaving(true); setMessage(''); try { if (file) await uploadBill(token, transactionId, file); else await attachExistingBill(token, transactionId, selectedBillId); setMessage('Bill matched to this transaction.'); setTimeout(() => onSaved(transactionId), 650); } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to save the bill match.'); } finally { setSaving(false); } };
  useMessageHaptic(message.includes('matched') ? '' : message, true);
  const selectedTransaction = transactions.find((item) => item.id === transactionId);
  // Same bill area as Transaction details: one box to take/choose a photo, uploaded bills as images.
  const [sourceOpen, setSourceOpen] = useState(false);
  useBackHandler(sourceOpen, () => setSourceOpen(false));
  const pickImage = async (source: 'camera' | 'gallery') => {
    setSourceOpen(false);
    if (!(await requestBillMediaPermission(source))) { setMessage(`Allow ${source === 'camera' ? 'camera' : 'photo library'} access to add a bill.`); return; }
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setFile({ uri: asset.uri, name: asset.fileName ?? `bill-${Date.now()}.jpg`, mimeType: asset.mimeType ?? 'image/jpeg' });
    setSelectedBillId(''); setMessage('');
  };
  const [viewerUri, setViewerUri] = useState('');
  const selectedBill = availableBills.find((bill) => bill.id === selectedBillId);
  const ready = (!!file || !!selectedBillId) && !!transactionId && !saving;
  return <View style={[{ flex: 1, backgroundColor: '#F4F6FA' }, sourceOpen && { zIndex: 20, elevation: 20 }]}>
    <ScrollView contentContainerStyle={uploadScreen.screen}>
      <View style={uploadScreen.header}><BackButton onPress={onBack} /><Text style={uploadScreen.title}>Upload bill</Text></View>
      {preferredTransactionId
        ? <LinearGradient colors={['#111A32', '#17264C', '#2B3C82']} start={{ x: 0, y: 0.25 }} end={{ x: 1, y: 0.75 }} style={detail.summaryCard}>
            <Text numberOfLines={1} style={detail.summaryMeta}>{selectedTransaction?.postedLabel ?? ''} · {selectedTransaction?.bankAccountNumber ?? 'No account'}</Text>
            <Text style={detail.summaryAmount}>{money(selectedTransaction?.amount ?? 0)}</Text>
            <Text numberOfLines={1} style={detail.summaryMerchant}>{selectedTransaction?.description || selectedTransaction?.merchant || 'Transaction'}</Text>
          </LinearGradient>
        : <><Text style={uploadScreen.label}>Select missing transaction</Text><View style={{ gap: 8 }}>{missing.map((item) => <Pressable key={item.id} onPress={() => { setTransactionId(item.id); setMessage(''); }} style={[uploadScreen.selector, { height: 64 }, transactionId === item.id && { borderColor: '#5C70FF', borderWidth: 2 }]}><View><Text numberOfLines={1} style={{ color: '#17223A', fontWeight: '800' }}>{item.merchant}</Text><Text style={{ color: '#71809A', marginTop: 3 }}>{item.postedLabel} · {money(item.amount)}</Text></View>{transactionId === item.id && <Text style={{ color: '#5C70FF', fontWeight: '800' }}>✓</Text>}</Pressable>)}</View></>}
      <View style={[detail.billPanel, { marginTop: 16 }]}>
        <Text style={detail.billTitle}>Bill</Text>
        <Pressable onPress={() => setSourceOpen(true)} style={detail.billFile} accessibilityRole="button" accessibilityLabel="Upload bill">
          <View style={detail.fileIcon}><FileText size={28} color="#A2AECB" /></View>
          <View style={detail.fileInfo}>
            <Text numberOfLines={1} style={detail.fileName}>{file?.name ?? 'Upload bill'}</Text>
            <Text numberOfLines={1} style={detail.fileMeta}>{file ? 'Ready to save to this transaction' : 'Take a photo or choose from gallery'}</Text>
          </View>
          <View style={[detail.fileBadge, { backgroundColor: '#FDEBEC' }]}><Text style={[detail.fileBadgeText, { color: '#D9363E' }]}>{file ? 'Ready' : 'Upload'}</Text></View>
        </Pressable>
        {loadingBills && <BillOptionsSkeleton count={1} />}
        {!loadingBills && availableBills.length > 0 && <>
          <Text style={detail.thumbHeading}>Uploaded bills · tap one to attach</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={detail.thumbRow}>
            {availableBills.map((bill) => {
              const chosen = selectedBillId === bill.id;
              return <Pressable key={bill.id} onPress={() => { setSelectedBillId(chosen ? '' : bill.id); setFile(null); setMessage(''); }}
                style={[detail.thumb, chosen && detail.thumbOn]} accessibilityRole="imagebutton" accessibilityState={{ selected: chosen }} accessibilityLabel={billHeadline(bill)}>
                {bill.mimeType.startsWith('image/')
                  ? <AuthImage token={token} url={billFileUrl(bill.id)} cacheKey={`thumb-${bill.id}`} style={detail.thumbImage} />
                  : <View style={[detail.thumbImage, detail.thumbPdf]}><FileText size={26} color="#8A96AD" /><Text style={detail.thumbPdfText}>PDF</Text></View>}
                {chosen && <View style={detail.thumbTick}><Check size={13} color="#FFF" strokeWidth={3.5} /></View>}
              </Pressable>;
            })}
          </ScrollView>
        </>}
        {file?.mimeType?.startsWith('image/') && <Pressable onPress={() => setViewerUri(file.uri)} accessibilityRole="imagebutton" accessibilityLabel="View bill photo"><LoadingImage uri={file.uri} style={detail.billPreview} resizeMode="contain" /><Text style={detail.previewHint}>Tap photo to view full screen</Text></Pressable>}
        {!file && selectedBill?.mimeType.startsWith('image/') && <AuthImage token={token} url={billFileUrl(selectedBill.id)} cacheKey={`thumb-${selectedBill.id}`} style={detail.billPreview} />}
      </View>
      {!!message && <Text style={{ color: message.includes('matched') ? '#159148' : '#D9363E', textAlign: 'center', fontWeight: '700', marginTop: 16 }}>{message}</Text>}
      <Pressable onPress={save} disabled={!ready} style={[uploadScreen.save, !ready && { backgroundColor: '#A7B1FA' }]}><Text style={uploadScreen.saveText}>{saving ? 'Saving…' : 'Save bill match'}</Text></Pressable>
    </ScrollView>
    {sourceOpen && <UploadOptionsSheet subtitle="Add a bill to this transaction" onClose={() => setSourceOpen(false)} onCamera={() => void pickImage('camera')} onGallery={() => void pickImage('gallery')} onFiles={() => { setSourceOpen(false); void chooseFile(); }} />}
    {!!viewerUri && <ImageViewer uri={viewerUri} onClose={() => setViewerUri('')} />}
  </View>;
}

type PickedFile = { uri: string; name: string; mimeType?: string | null };

function ChoiceSheet({ title, options, selectedId, onChoose, onClose }: { title: string; options: Array<{ id: string; label: string; sub?: string; icon?: ReactNode }>; selectedId: string; onChoose: (id: string) => void; onClose: () => void }) {
  return <View style={s.overlay}>
    <Pressable style={s.overlayTap} onPress={onClose} />
    <SlideUpSheet onClose={onClose} style={detail.sheet} scrollable>
      <View style={s.handle} />
      <View style={detail.sheetHead}>
        <Text style={detail.sheetTitle}>{title}</Text>
        <Pressable style={[s.close, { marginLeft: "auto" }]} onPress={onClose}><Text style={s.closeText}>×</Text></Pressable>
      </View>
      {options.map((option) => <Pressable key={option.id} onPress={() => onChoose(option.id)} style={[detail.sheetRow, option.id === selectedId && detail.sheetSelected, !!option.icon && { flexDirection: "row", alignItems: "center", gap: 12 }]}>
        {option.icon}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={detail.sheetName}>{option.label}</Text>
          {!!option.sub && <Text style={detail.sheetSub}>{option.sub}</Text>}
        </View>
      </Pressable>)}
    </SlideUpSheet>
  </View>;
}

function BankChoiceSheet({ accounts, selectedId, onChoose, onClose, onSetPrimary }: { accounts: Workspace['bankAccounts']; selectedId: string; onChoose: (id: string) => void; onClose: () => void; onSetPrimary?: (account: Workspace['bankAccounts'][number], primary: boolean) => Promise<void> }) {
  const ordered = [...accounts].sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary));
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  useMessageHaptic(error, true);
  const togglePrimary = async (account: Workspace['bankAccounts'][number]) => {
    if (!onSetPrimary) return;
    setSavingId(account.id); setError("");
    try { await onSetPrimary(account, !account.isPrimary); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to change the primary account."); }
    finally { setSavingId(""); }
  };
  return <View style={s.overlay}>
    <Pressable style={s.overlayTap} onPress={onClose} />
    <SlideUpSheet onClose={onClose} style={s.business} scrollable>
      <View style={s.handle} />
      <View style={s.businessHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.businessTitle}>Select bank account</Text>
          <Text style={bankPickUi.subtitle}>{onSetPrimary ? "Tap to choose · use the switch to set the primary account" : "Choose where this bill belongs"}</Text>
        </View>
        <Pressable style={s.close} onPress={onClose}><Text style={s.closeText}>×</Text></Pressable>
      </View>
      {!!error && <Text style={bankPickUi.error}>{error}</Text>}
      {ordered.map((account) => {
        const selected = account.id === selectedId;
        return <View key={account.id} style={[bankPickUi.row, selected && bankPickUi.rowOn]}>
          <BankPickMain account={account} selected={selected} onPress={() => onChoose(account.id)} />
          {onSetPrimary && <Pressable onPress={() => void togglePrimary(account)} disabled={!!savingId} hitSlop={10} style={bankPickUi.switchBox} accessibilityRole="switch" accessibilityState={{ checked: !!account.isPrimary, busy: savingId === account.id }} accessibilityLabel={`Primary account: ${account.name}`}>
            {savingId === account.id ? <ActivityIndicator size="small" color="#5C70FF" /> : <View style={[bankPickUi.track, account.isPrimary && bankPickUi.trackOn]}><View style={[bankPickUi.thumb, account.isPrimary && bankPickUi.thumbOn]} /></View>}
            <Text style={[bankPickUi.switchLabel, account.isPrimary && bankPickUi.switchLabelOn]}>Primary</Text>
          </Pressable>}
        </View>;
      })}
      {!accounts.length && <Text style={{ color: "#8A96AC", textAlign: "center", paddingVertical: 18 }}>No bank accounts for this business.</Text>}
    </SlideUpSheet>
  </View>;
}

// One bank row in the Home style: icon tile, name with a check when selected, number · type.
function BankPickMain({ account, selected, onPress }: { account: Workspace['bankAccounts'][number]; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [bankPickUi.main, pressed && { opacity: 0.7 }]} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={account.name}>
    <View style={[bankPickUi.iconTile, selected && bankPickUi.iconTileOn]}><InstitutionIcon accountType={account.accountType} cardType={account.cardType} /></View>
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={bankPickUi.nameLine}>
        <Text numberOfLines={1} style={bankPickUi.name}>{account.name}</Text>
        {selected && <View style={bankPickUi.check}><Check size={10} color="#FFF" strokeWidth={3.5} /></View>}
      </View>
      <Text numberOfLines={1} style={bankPickUi.meta}>{compactMask(account.maskedNumber)} · {shortAccountType(account.accountType)}</Text>
    </View>
  </Pressable>;
}

// Same look as the phone's Photos app icon: blue sky, glowing orange sun, wavy deep-blue sea.
function PhoneGalleryIcon({ size = 32 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="gallerySky" x1="0" y1="1" x2="1" y2="0">
        <Stop offset="0" stopColor="#0A84F5" />
        <Stop offset="1" stopColor="#3EC2FF" />
      </SvgLinearGradient>
      <SvgLinearGradient id="gallerySea" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#2563EB" />
        <Stop offset="1" stopColor="#1D46D8" />
      </SvgLinearGradient>
      <SvgRadialGradient id="galleryGlow" cx="0.5" cy="0.5" r="0.5">
        <Stop offset="0.55" stopColor="#FFD27A" stopOpacity="0.9" />
        <Stop offset="1" stopColor="#FFD27A" stopOpacity="0" />
      </SvgRadialGradient>
      <SvgLinearGradient id="gallerySun" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFC940" />
        <Stop offset="1" stopColor="#FF8A00" />
      </SvgLinearGradient>
      <ClipPath id="galleryClip"><SvgRect x="0" y="0" width="100" height="100" rx="28" /></ClipPath>
    </Defs>
    <G clipPath="url(#galleryClip)">
      <SvgRect x="0" y="0" width="100" height="100" fill="url(#gallerySky)" />
      <SvgCircle cx="64" cy="46" r="24" fill="url(#galleryGlow)" />
      <SvgCircle cx="64" cy="46" r="14" fill="url(#gallerySun)" />
      <Path d="M0 56 C 20 50, 38 50, 56 55 S 86 60, 100 54 V100 H0 Z" fill="url(#gallerySea)" />
      <Path d="M0 72 C 22 66, 44 68, 62 73 S 88 78, 100 72 V100 H0 Z" fill="#1A3FC7" opacity={0.55} />
    </G>
  </Svg>;
}

// Grid of every bill uploaded for the selected business. Tap an image to view it full screen.
function BillGallery({ token, business, onBack, onOpenTransaction }: { token: string; business: { id: string; name: string } | null; onBack: () => void; onOpenTransaction: (transactionId: string) => void }) {
  const [bills, setBills] = useState<GalleryBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<GalleryBill | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  useBackHandler(!!open, () => setOpen(null));
  useMessageHaptic(error, true);
  const businessId = business?.id ?? "";
  // Only bills still waiting for a transaction; matched ones live on their transaction.
  const shown = useMemo(() => bills.filter((bill) => bill.source !== "transaction" && !bill.transactionId), [bills]);
  const load = async () => {
    if (!businessId || !token) return;
    try { const result = await getBillGallery(token, businessId); setBills(result.bills); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load bills."); }
  };
  useEffect(() => {
    setLoading(true); setBills([]);
    const startedAt = Date.now();
    // Placeholders stay at least a moment so opening the gallery never flashes.
    void load().then(() => new Promise((resolve) => setTimeout(resolve, Math.max(0, 500 - (Date.now() - startedAt))))).finally(() => setLoading(false));
  }, [businessId, token]);
  const refreshControl = usePullRefresh(load);
  // Protected images are downloaded to the app cache (Android Image cannot send the auth header).
  useEffect(() => {
    let active = true;
    const missing = shown.filter((bill) => bill.mimeType.startsWith("image/") && !thumbs[bill.id]);
    void (async () => {
      for (const bill of missing) {
        try {
          const uri = await downloadBillPreview(token, billUrlOf(bill), `gallery-${bill.id}`, bill.mimeType);
          if (!active) return;
          setThumbs((current) => ({ ...current, [bill.id]: uri }));
        } catch { /* the tile keeps its placeholder */ }
      }
    })();
    return () => { active = false; };
  }, [shown, token]);
  // A waiting bill is served from /bills, one already on a transaction from that transaction.
  const billUrlOf = (bill: GalleryBill) => bill.source === 'transaction' ? transactionBillFileUrl(bill.id) : billFileUrl(bill.id);
  const openBill = (bill: GalleryBill) => setOpen(bill);
  // Opens full screen as soon as the image has been downloaded.
  const openUri = open ? thumbs[open.id] ?? "" : "";
  return <View style={{ flex: 1, backgroundColor: "#F4F6FA" }}>
    <ScrollView refreshControl={refreshControl} contentContainerStyle={galleryUi.screen} showsVerticalScrollIndicator={false}>
      <View style={galleryUi.header}>
        <BackButton onPress={onBack} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={galleryUi.title}>Bill gallery</Text>
          <Text numberOfLines={1} style={galleryUi.subtitle}>{business?.name ?? "No business selected"} · {shown.length} {shown.length === 1 ? "unmatched bill" : "unmatched bills"}</Text>
        </View>
      </View>
      {!!error && <Text style={galleryUi.error}>{error}</Text>}
      {loading ? <Skeleton style={galleryUi.grid}>
        {Array.from({ length: 9 }, (_, index) => <View key={index} style={galleryUi.cell}><View style={galleryUi.boneTile}><Bone height="100%" radius={14} /></View><Bone width="70%" height={10} style={{ marginTop: 8 }} /></View>)}
      </Skeleton> : <View style={galleryUi.grid}>
        {shown.map((bill) => {
          const isImage = bill.mimeType.startsWith("image/");
          const thumb = thumbs[bill.id];
          return <Pressable key={bill.id} onPress={() => openBill(bill)} style={({ pressed }) => [galleryUi.cell, pressed && { opacity: 0.75 }]} accessibilityRole="imagebutton" accessibilityLabel={bill.fileName}>
            <View style={galleryUi.tile}>
              {isImage && thumb ? <LoadingImage uri={thumb} style={galleryUi.image} />
                : isImage ? <View style={StyleSheet.absoluteFill}><Skeleton style={StyleSheet.absoluteFill}><Bone height="100%" radius={0} /></Skeleton><View pointerEvents="none" style={loadingImageUi.overlay}><ActivityIndicator size="small" color="#5C70FF" /></View></View>
                : <View style={galleryUi.pdf}><FileText size={30} color="#8A96AD" /><Text style={galleryUi.pdfText}>PDF</Text></View>}
              <View style={[galleryUi.badge, bill.transactionId ? galleryUi.badgeOn : galleryUi.badgeOff]}>
                {bill.transactionId ? <Check size={10} color="#FFF" strokeWidth={3.5} /> : <Text style={galleryUi.badgeDot}>•</Text>}
              </View>
            </View>
            <Text numberOfLines={1} style={galleryUi.cellTitle}>{bill.transactionMerchant || bill.billVendor || bill.fileName}</Text>
            <Text numberOfLines={1} style={galleryUi.cellSub}>{new Date(bill.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}{bill.transactionAmount != null ? ` · ${money(bill.transactionAmount)}` : ""}</Text>
          </Pressable>;
        })}
      </View>}
      {!loading && !shown.length && !error && <View style={galleryUi.empty}>
        <Images size={40} color="#B3BCCD" />
        <Text style={galleryUi.emptyTitle}>{bills.length ? "All bills are matched" : "No bills uploaded yet"}</Text>
        <Text style={galleryUi.emptySub}>{bills.length ? "Bills waiting for a transaction will show here." : "Bills you upload for this business will show here."}</Text>
      </View>}
    </ScrollView>
    {open && (openUri ? <ImageViewer uri={openUri} onClose={() => setOpen(null)} footer={
      <View style={galleryUi.info}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={galleryUi.infoTitle}>{open.transactionMerchant || open.billVendor || open.fileName}</Text>
          <Text numberOfLines={1} style={galleryUi.infoSub}>{open.transactionId ? `Matched · ${open.transactionDate ?? ""} · ${money(open.transactionAmount ?? 0)}` : "Not matched yet"}{open.bankAccountName ? ` · ${open.bankAccountName}` : ""}</Text>
        </View>
        {!!open.transactionId && <Pressable onPress={() => { const id = open.transactionId!; setOpen(null); onOpenTransaction(id); }} style={galleryUi.infoBtn} accessibilityRole="button"><Text style={galleryUi.infoBtnText}>Open</Text></Pressable>}
      </View>
    } /> : <View style={s.overlay}>
      <Pressable style={s.overlayTap} onPress={() => setOpen(null)} />
      <SlideUpSheet style={uploadOptions.sheet} onClose={() => setOpen(null)}>
        <View style={s.handle} />
        <View style={uploadOptions.head}>
          <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
            <Text numberOfLines={1} style={uploadOptions.title}>{open.fileName}</Text>
            <Text numberOfLines={1} style={uploadOptions.subtitle}>{open.mimeType.startsWith("image/") ? "Image is still loading…" : "PDF bill"} · {Math.round(open.fileSizeBytes / 1024)} KB</Text>
          </View>
          <Pressable style={s.close} onPress={() => setOpen(null)}><Text style={s.closeText}>×</Text></Pressable>
        </View>
        <Text style={galleryUi.sheetLine}>{open.transactionId ? `Matched to ${open.transactionMerchant ?? "a transaction"} · ${money(open.transactionAmount ?? 0)}` : "Not matched to a transaction yet"}</Text>
        {!!open.transactionId && <Pressable onPress={() => { const id = open.transactionId!; setOpen(null); onOpenTransaction(id); }} style={[uploadOptions.option, { justifyContent: "center", backgroundColor: "#5C70FF", borderWidth: 0, minHeight: 56 }]}><Text style={{ color: "#FFF", fontWeight: "800", fontSize: 16 }}>Open transaction</Text></Pressable>}
      </SlideUpSheet>
    </View>)}
  </View>;
}

const galleryUi = StyleSheet.create({
  screen: { padding: 16, paddingTop: 18, paddingBottom: 126 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  title: { color: "#17223A", fontSize: 25, fontWeight: "800" },
  subtitle: { color: "#8290A8", fontSize: 14, marginTop: 2 },
  error: { color: "#D9363E", textAlign: "center", fontWeight: "700", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  cell: { width: "33.333%", paddingHorizontal: 5, marginBottom: 14 },
  tile: { width: "100%", aspectRatio: 0.8, borderRadius: 14, overflow: "hidden", backgroundColor: "#E9EDF4", borderWidth: 1, borderColor: "#E1E6EF" },
  boneTile: { width: "100%", aspectRatio: 0.8 },
  image: { width: "100%", height: "100%" },
  pdf: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: "#F7F8FB" },
  pdfText: { color: "#8A96AD", fontSize: 12, fontWeight: "800" },
  badge: { position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFF" },
  badgeOn: { backgroundColor: "#16A34A" },
  badgeOff: { backgroundColor: "#F59E0B" },
  badgeDot: { color: "#FFF", fontSize: 12, lineHeight: 14, fontWeight: "900" },
  cellTitle: { color: "#17223A", fontSize: 12, fontWeight: "800", marginTop: 6 },
  cellSub: { color: "#8290A8", fontSize: 11, marginTop: 1 },
  empty: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyTitle: { color: "#3E4A63", fontSize: 16, fontWeight: "800" },
  emptySub: { color: "#8290A8", fontSize: 13 },
  info: { position: "absolute", left: 16, right: 16, bottom: 72, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, backgroundColor: "rgba(16,24,47,0.88)", padding: 14 },
  infoTitle: { color: "#FFF", fontSize: 15, fontWeight: "800" },
  infoSub: { color: "#C8D1E9", fontSize: 12, marginTop: 2 },
  infoBtn: { borderRadius: 12, backgroundColor: "#5C70FF", paddingHorizontal: 16, paddingVertical: 10 },
  infoBtnText: { color: "#FFF", fontWeight: "800" },
  sheetLine: { color: "#3E4A63", fontSize: 14, fontWeight: "600", marginBottom: 14 },
});

function UploadBillPage({ token, businesses, defaultBusinessId = "", defaultBankId = null, onBack, onUploaded, onGallery, onAccountsChanged }: { token: string; businesses: AuthSession['businesses']; defaultBusinessId?: string; defaultBankId?: string | null; onBack: () => void; onUploaded: (businessId: string) => Promise<void>; onGallery?: (businessId: string) => void; onAccountsChanged?: (businessId: string) => void }) {
  // Starts on the business (and bank) selected on Home, and follows it when Home changes.
  const [businessId, setBusinessId] = useState(defaultBusinessId);
  const preferredBank = useRef(defaultBankId);
  useEffect(() => {
    if (!defaultBusinessId || defaultBusinessId === businessId) return;
    preferredBank.current = defaultBankId;
    setBusinessId(defaultBusinessId);
    setAccountId("");
  }, [defaultBusinessId]);
  const [accounts, setAccounts] = useState<Workspace['bankAccounts']>([]);
  const [accountId, setAccountId] = useState("");
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [sheet, setSheet] = useState<"" | "business" | "bank" | "source">("");
  const [viewerUri, setViewerUri] = useState("");
  // Business of the last saved bill, for the "view in gallery" shortcut.
  const [lastSavedBusiness, setLastSavedBusiness] = useState("");
  useBackHandler(!!sheet, () => setSheet(""));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  useAutoClear(message?.tone === "success", message, () => setMessage(null));
  const business = businesses.find((item) => item.id === businessId);
  const account = accounts.find((item) => item.id === accountId);

  useEffect(() => {
    if (!businessId || !token) return;
    let active = true;
    setLoadingAccounts(true);
    setAccounts([]);
    getBusinessAccounts(token, businessId)
      .then(({ accounts: list }) => {
        if (!active) return;
        setAccounts(list);
        // Always pick a bank for the chosen business: Home's bank if it belongs here, else the primary, else the first.
        const pick = list.find((item) => item.id === preferredBank.current) ?? list.find((item) => item.isPrimary) ?? list[0];
        setAccountId(pick?.id ?? "");
        preferredBank.current = null;
      })
      .catch((error) => { if (active) setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to load bank accounts." }); })
      .finally(() => { if (active) setLoadingAccounts(false); });
    return () => { active = false; };
  }, [businessId, token]);

  const chooseBusiness = (id: string) => {
    setSheet("");
    if (id === businessId) return;
    setBusinessId(id);
    setAccountId("");
    setMessage(null);
  };

  const pick = async (source: "camera" | "gallery" | "file") => {
    setSheet("");
    setMessage(null);
    try {
      if (source === "file") {
        const result = await DocumentPicker.getDocumentAsync({ type: ["image/jpeg", "image/png"], copyToCacheDirectory: true });
        if (!result.canceled) { const asset = result.assets[0]; setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType }); }
        return;
      }
      if (!(await requestBillMediaPermission(source))) { setMessage({ tone: "error", text: `Allow ${source === "camera" ? "camera" : "photo library"} access to add a bill.` }); return; }
      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
      if (!result.canceled) { const asset = result.assets[0]; setFile({ uri: asset.uri, name: asset.fileName ?? `bill-${Date.now()}.jpg`, mimeType: asset.mimeType ?? "image/jpeg" }); }
    } catch {
      setMessage({ tone: "error", text: "Unable to add that bill. Try again." });
    }
  };

  // Same as Home: turning primary on moves it from the other account; off leaves none.
  const setPrimary = async (target: Workspace['bankAccounts'][number], primary: boolean) => {
    await updateBankAccount(token, businessId, target.id, { name: target.name, accountType: target.accountType, isPrimary: primary });
    const { accounts: list } = await getBusinessAccounts(token, businessId);
    setAccounts(list);
    haptic.success();
    setMessage({ tone: "success", text: primary ? `${target.name} is now the primary account.` : `${target.name} is no longer primary.` });
    onAccountsChanged?.(businessId);
  };
  const needsBank = accounts.length > 0;
  // Like OATRx, a bill always belongs to a bank account.
  const ready = !!business && !!account && !!file && !loadingAccounts;
  const save = async () => {
    if (!business) { setMessage({ tone: "error", text: "Select a business first." }); return; }
    if (!needsBank) { setMessage({ tone: "error", text: "Add a bank account to this business before uploading bills." }); return; }
    if (!account) { setMessage({ tone: "error", text: "Select the bank account for this bill." }); return; }
    if (!file) { setMessage({ tone: "error", text: "Upload or capture the bill first." }); return; }
    setSaving(true);
    setMessage(null);
    try {
      const saved = await uploadStandaloneBill(token, { businessId: business.id, bankAccountId: account.id, file });
      setFile(null);
      setLastSavedBusiness(business.id);
      const target = `${business.name} · ${account.name} ${account.maskedNumber}`;
      setMessage({ tone: "success", text: saved.aiReading
        ? `Bill saved to ${target}. It will be read and attached automatically to the matching transaction.`
        : `Bill saved to ${target}. Attach it to a transaction anytime.` });
      await onUploaded(business.id);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to save the bill." });
    } finally {
      setSaving(false);
    }
  };

  const bankLabel = !business ? "Select Business Name First" : loadingAccounts ? "Loading banks…" : account ? `${account.name} ${account.maskedNumber}` : needsBank ? "Select Bank" : "No bank accounts for this business";
  const isPdf = !!file && (file.mimeType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
  // Lift the page above the tab bar while a sheet is open so the sheet is not covered.
  return <View style={[billUpload.screen, !!sheet && billUpload.raised]}>
    <View style={billUpload.header}>
      <BackButton onPress={onBack} label="Back to home" />
      <Text style={billUpload.title}>Upload Bill</Text>
    </View>
    <ScrollView contentContainerStyle={billUpload.body} keyboardShouldPersistTaps="handled">
      <Text style={billUpload.label}>Select Business Name</Text>
      <Pressable onPress={() => setSheet("business")} style={billUpload.field} accessibilityRole="button">
        <Text numberOfLines={1} style={[billUpload.fieldText, !business && billUpload.placeholder]}>{business?.name ?? "Select Business Name"}</Text>
        <ChevronDown size={20} color="#6B778F" />
      </Pressable>

      <Text style={[billUpload.label, billUpload.spaced]}>Select Bank</Text>
      <Pressable onPress={() => setSheet("bank")} disabled={!business || loadingAccounts || !needsBank} style={[billUpload.field, (!!account || loadingAccounts) && billUpload.fieldBank, (!business || !needsBank) && billUpload.fieldDisabled]} accessibilityRole="button">
        {loadingAccounts ? <FieldSkeleton /> : account ? <>
          <View style={bankPickUi.iconTile}><InstitutionIcon accountType={account.accountType} cardType={account.cardType} /></View>
          <View style={{ flex: 1, minWidth: 0, marginLeft: 2 }}>
            <Text numberOfLines={1} style={bankPickUi.name}>{account.name}</Text>
            <Text numberOfLines={1} style={bankPickUi.meta}>{compactMask(account.maskedNumber)} · {shortAccountType(account.accountType)}</Text>
          </View>
        </> : <Text numberOfLines={1} style={[billUpload.fieldText, billUpload.placeholder, !business && billUpload.placeholderDisabled]}>{bankLabel}</Text>}
        <ChevronDown size={20} color={business ? "#6B778F" : "#A9B2C3"} />
      </Pressable>

      <Text style={[billUpload.label, billUpload.spaced]}>Upload Bill</Text>
      <Pressable onPress={() => setSheet("source")} style={billUpload.dropzone} accessibilityRole="button" accessibilityLabel="Upload or capture bill">
        {file && !isPdf ? <Pressable onPress={() => setViewerUri(file.uri)} accessibilityLabel="View bill photo"><LoadingImage uri={file.uri} style={billUpload.preview} resizeMode="contain" /></Pressable> : <View style={billUpload.dropIcon}>{isPdf ? <FileText size={26} color="#5C70FF" /> : <Camera size={26} color="#6B778F" />}</View>}
        <Text numberOfLines={1} style={billUpload.dropTitle}>{file ? file.name : "Tap to upload or capture bill"}</Text>
        <Text style={billUpload.dropSub}>{file ? "Tap to change the bill" : "Select from gallery or use camera"}</Text>
      </Pressable>

      {!!message && <Text style={[billUpload.message, message.tone === "success" ? billUpload.success : billUpload.error]}>{message.text}</Text>}
      <Pressable onPress={save} disabled={!ready || saving} style={[billUpload.save, (!ready || saving) && billUpload.saveDisabled]} accessibilityRole="button">
        <Text style={billUpload.saveText}>{saving ? "Saving…" : "Save Bill"}</Text>
      </Pressable>
    </ScrollView>

    {sheet === "business" && <ChoiceSheet title="Select business" options={businesses.map((item) => ({ id: item.id, label: item.name, icon: <BusinessLogo business={item} size={36} radius={10} fallback={<BusinessIconTile size={36} radius={10} />} /> }))} selectedId={businessId} onChoose={chooseBusiness} onClose={() => setSheet("")} />}
    {sheet === "bank" && <BankChoiceSheet accounts={accounts} selectedId={accountId} onChoose={(id) => { setAccountId(id); setSheet(""); setMessage(null); }} onClose={() => setSheet("")} onSetPrimary={setPrimary} />}
    {!!viewerUri && <ImageViewer uri={viewerUri} onClose={() => setViewerUri("")} />}
    {sheet === "source" && <UploadOptionsSheet subtitle={business ? `${business.name}${account ? ` · ${account.name} ${account.maskedNumber}` : ""}` : "Choose how to add the bill"} onClose={() => setSheet("")} onCamera={() => void pick("camera")} onGallery={() => void pick("gallery")} />}
  </View>;
}

const billUpload = StyleSheet.create({
  fieldBank: { height: undefined, minHeight: 68, paddingVertical: 10, paddingLeft: 12 },
  galleryLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#C9D0FF", backgroundColor: "#F5F6FF", marginTop: 12 },
  galleryLinkText: { color: "#4B5BE0", fontSize: 14, fontWeight: "800" },
  screen: { flex: 1, backgroundColor: "#F4F6FA" },
  raised: { zIndex: 20, elevation: 20 },
  // The app shell already adds the status-bar padding, so the header only needs a small inset.
  header: { paddingTop: 4, paddingBottom: 12, paddingHorizontal: 18, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#E6EAF2", flexDirection: "row", alignItems: "center", gap: 14 },
  back: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: "#E3E7EF", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: "#15203D" },
  body: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 140 },
  label: { fontSize: 15, fontWeight: "700", color: "#17223A", marginBottom: 8 },
  spaced: { marginTop: 18 },
  field: { height: 56, borderRadius: 16, borderWidth: 1, borderColor: "#E3E7EF", backgroundColor: "#FFF", paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  fieldDisabled: { backgroundColor: "#F7F8FB" },
  fieldText: { flex: 1, fontSize: 16, color: "#17223A", fontWeight: "600" },
  placeholder: { color: "#6D7990", fontWeight: "400" },
  placeholderDisabled: { color: "#A0A9BA" },
  dropzone: { minHeight: 188, borderRadius: 20, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#C9D0DC", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", paddingHorizontal: 18, paddingVertical: 18 },
  dropIcon: { width: 68, height: 68, borderRadius: 20, backgroundColor: "#F1F3F7", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  preview: { width: 160, height: 104, borderRadius: 12, marginBottom: 12, backgroundColor: "#F1F3F7" },
  dropTitle: { fontSize: 16, fontWeight: "800", color: "#101A32", maxWidth: "100%" },
  dropSub: { fontSize: 14, color: "#66748F", marginTop: 6 },
  message: { fontSize: 14, fontWeight: "700", textAlign: "center", marginTop: 14 },
  success: { color: "#159148" },
  error: { color: "#D9363E" },
  save: { height: 56, borderRadius: 16, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center", marginTop: 26 },
  saveDisabled: { backgroundColor: "#A7B1FA" },
  saveText: { fontSize: 17, fontWeight: "800", color: "#FFF" },
});
function PickerSheet({title,items,choose,close}:{title:string,items:string[][],choose:(x:string)=>void,close:()=>void}){return <View style={s.overlay}><Pressable style={s.overlayTap} onPress={close}/><SlideUpSheet onClose={close} style={detail.sheet} scrollable><View style={s.handle}/><View style={detail.sheetHead}><Text style={detail.sheetTitle}>{title}</Text><Pressable style={s.close} onPress={close}><Text style={s.closeText}>×</Text></Pressable></View>{items.map(([name,sub])=><Pressable key={name} onPress={()=>choose(name)} style={detail.sheetRow}><Text style={detail.sheetName}>{name}</Text><Text style={detail.sheetSub}>{sub}</Text></Pressable>)}</SlideUpSheet></View>}
const uploadScreen = StyleSheet.create({
  screen: {
    padding: 24,
    paddingBottom: 124,
    backgroundColor: "#F4F6FA",
    flexGrow: 1,
  },
  header: {
    height: 86,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    marginHorizontal: -6,
  },
  back: {
    height: 54,
    width: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E5EF",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 31, color: "#253049", marginTop: -4 },
  title: { fontSize: 28, fontWeight: "700", color: "#15203D", marginLeft: 18 },
  label: {
    fontSize: 17,
    fontWeight: "600",
    color: "#17223A",
    marginBottom: 10,
  },
  selector: {
    height: 74,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0E5EF",
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  placeholder: { fontSize: 17, color: "#6D7990" },
  dropzone: {
    height: 246,
    borderRadius: 25,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#6980FF",
    backgroundColor: "#F2F4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    height: 78,
    width: 78,
    borderRadius: 25,
    backgroundColor: "#F7F8FC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  dropTitle: { fontSize: 18, fontWeight: "700", color: "#17223A" },
  dropSub: { fontSize: 15, color: "#66748F", marginTop: 10 },
  save: {
    height: 76,
    borderRadius: 21,
    backgroundColor: "#A7B1FA",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 42,
  },
  saveText: { fontSize: 20, fontWeight: "700", color: "#FFF" },
});

function NewTransaction({ token, workspace, onBack, onCreated }: { token: string; workspace: Workspace | null; onBack: () => void; onCreated: () => void }) {
  const [merchant, setMerchant] = useState(''); const [amount, setAmount] = useState(''); const [category, setCategory] = useState('Uncategorized'); const [gst, setGst] = useState('0'); const [pst, setPst] = useState('0'); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const business = workspace?.activeBusiness; const account = workspace?.bankAccounts[0];
  const save = async () => { if (!business || !merchant.trim() || !amount.trim()) { setError('Enter a merchant and amount.'); return; } setSaving(true); setError(''); try { await createTransaction(token, { businessId: business.id, bankAccountId: account?.id, postedOn: new Date().toISOString().slice(0, 10), merchant: merchant.trim(), amount: Number(amount), category: category.trim() || 'Uncategorized', gst: Number(gst || 0), pst: Number(pst || 0) }); onCreated(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save the transaction.'); } finally { setSaving(false); } };
  return <ScrollView contentContainerStyle={pageUi.screen}><DetailPageHeader title="New transaction" onBack={onBack} /><View style={pageUi.formCard}><Text style={pageUi.formLabel}>Merchant *</Text><TextInput value={merchant} onChangeText={setMerchant} placeholder="e.g. Office supply store" style={pageUi.formInput}/><Text style={[pageUi.formLabel, pageUi.formFieldSpaced]}>Amount *</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="-125.00" style={pageUi.formInput}/><Text style={[pageUi.formLabel, pageUi.formFieldSpaced]}>Category</Text><TextInput value={category} onChangeText={setCategory} style={pageUi.formInput}/><Text style={[pageUi.formLabel, pageUi.formFieldSpaced]}>GST</Text><TextInput value={gst} onChangeText={setGst} keyboardType="decimal-pad" style={pageUi.formInput}/><Text style={[pageUi.formLabel, pageUi.formFieldSpaced]}>PST</Text><TextInput value={pst} onChangeText={setPst} keyboardType="decimal-pad" style={pageUi.formInput}/><Text style={{ color: '#71809A', marginTop: 16 }}>Business: {business?.name ?? 'No business selected'}{account ? ` · ${account.name}` : ''}</Text></View>{!!error && <Text style={{ color: '#D9363E', textAlign: 'center', marginTop: 14 }}>{error}</Text>}<Pressable onPress={save} disabled={saving} style={[pageUi.save, saving && { opacity: .55 }]}><Text style={pageUi.saveText}>{saving ? 'Saving…' : 'Save transaction'}</Text></Pressable></ScrollView>;
}

function AllTransactions({ transactions, onDetails, onLongPress, onRefresh, onGallery, onBack, filterSignal = 0, onFilterSignalHandled }: { onBack?: () => void; onGallery?: () => void; transactions: FinanceTransaction[]; onDetails: (id: string) => void; onLongPress?: (item: FinanceTransaction) => void; onRefresh?: () => Promise<void>; filterSignal?: number; onFilterSignalHandled?: () => void }) {
  const refreshControl = usePullRefresh(onRefresh);
  const [filterOpen, setFilterOpen] = useState(false);
  useBackHandler(filterOpen, () => setFilterOpen(false));
  // Opened from Quick actions → Search transactions.
  useEffect(() => { if (filterSignal) { setFilterOpen(true); onFilterSignalHandled?.(); } }, [filterSignal]);
  const [range, setRange] = useState<DateRange | null>(null);
  const [billTab, setBillTab] = useState<"all" | "billed" | "unbilled">("all");
  const shown = useMemo(() => recentlyAdded(transactions, Infinity).filter((item) =>
    (!range || inDateRange(item.postedOn, range)) &&
    (billTab === "all" || (billTab === "billed") === (item.billStatus === "attached")),
  ), [transactions, range, billTab]);
  const list = useIncrementalList(shown, `${range?.label ?? "all"}|${billTab}|${shown.length}`);
  // Placeholders for a moment each time the tab opens, and on every tab/filter change.
  const [switching, showSwitching] = useBriefLoading(800, true);
  return (
    // Lift the page above the tab bar while the date panel is open so Apply is not covered.
    <View style={[{ flex: 1, backgroundColor: "#F4F6FA" }, filterOpen && { zIndex: 20, elevation: 20 }]}>
      <ScrollView refreshControl={refreshControl} contentContainerStyle={transactionUi.screen} onScroll={list.onScroll} scrollEventThrottle={150} showsVerticalScrollIndicator={false}>
        <View style={transactionUi.titleRow}>
          {!!onBack && <BackButton onPress={onBack} label="Back to home" />}
          <Text numberOfLines={1} style={[transactionUi.title, { flex: 1, marginLeft: onBack ? 14 : 0 }]}>Transactions</Text>
          <View style={transactionUi.tools}>
            {onGallery && <Pressable onPress={onGallery} hitSlop={8} style={({ pressed }) => [transactionUi.galleryIcon, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]} accessibilityRole="button" accessibilityLabel="Bill gallery">
              <View style={transactionUi.galleryTile}><ImageIcon size={24} color="#FFF" strokeWidth={2.2} /></View>
            </Pressable>}
            <Pressable onPress={() => setFilterOpen(true)} style={[transactionUi.tool, !!range && transactionUi.toolActive]} accessibilityLabel="Filter by date">
              <Search size={25} color={range ? "#5C70FF" : "#17223A"} />
            </Pressable>
          </View>
        </View>
        <View style={transactionUi.billTabs}>
          {([["all", "All"], ["billed", "Billed"], ["unbilled", "Non-billed"]] as const).map(([id, label]) => (
            <Pressable key={id} onPress={() => { setBillTab(id); showSwitching(); }} style={transactionUi.billTab} accessibilityRole="tab" accessibilityState={{ selected: billTab === id }}>
              <Text style={[transactionUi.billTabText, billTab === id && transactionUi.billTabTextOn]}>{label}</Text>
              {billTab === id && <View style={transactionUi.billTabIndicator} />}
            </Pressable>
          ))}
        </View>
        {range && <DateRangeBar range={range} count={shown.length} onClear={() => { setRange(null); showSwitching(); }} />}
        {switching && <SkeletonRows count={8} />}
        {!switching && !!shown.length && (
          <View style={ui.homeTransactionList}>
            {list.visible.map((item, index) => <TransactionRow key={item.id} item={item} last={index === list.visible.length - 1} onPress={() => onDetails(item.id)} onLongPress={onLongPress} />)}
          </View>
        )}
        {!switching && !shown.length && <Text style={{ color: '#71809A', textAlign: 'center', marginTop: 28 }}>{billTab === 'billed' ? 'No billed transactions' : billTab === 'unbilled' ? 'No non-billed transactions' : 'No transactions'}{range ? ' in this date range.' : '.'}</Text>}
        <ListFooterLoader hasMore={!switching && list.hasMore} />
      </ScrollView>
      {filterOpen && <DateFilter value={range} onApply={(next) => { setRange(next); setFilterOpen(false); showSwitching(); }} onClose={() => setFilterOpen(false)} />}
    </View>
  );
}
type DateRange = { label: string; from: string; to: string };

function ymd(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function inDateRange(postedOn: string, range: DateRange) {
  const day = String(postedOn).slice(0, 10);
  return day >= range.from && day <= range.to;
}

function DateRangeBar({ range, count, onClear }: { range: DateRange; count: number; onClear: () => void }) {
  return (
    <View style={transactionUi.rangeBar}>
      <CalendarDays size={16} color="#5C70FF" />
      <Text numberOfLines={1} style={transactionUi.rangeText}>
        {range.label}<Text style={transactionUi.rangeCount}>{"  |  "}{count} {count === 1 ? "Transaction" : "Transactions"}</Text>
      </Text>
      <Pressable onPress={onClear} style={transactionUi.rangeClear} accessibilityRole="button" accessibilityLabel="Clear date filter">
        <Text style={transactionUi.rangeClearText}>Clear</Text>
      </Pressable>
    </View>
  );
}

function DateFilter({ value, onApply, onClose }: { value: DateRange | null; onApply: (range: DateRange | null) => void; onClose: () => void }) {
  const [picker, setPicker] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>(value ? new Date(`${value.from}T00:00:00`) : undefined);
  const [toDate, setToDate] = useState<Date | undefined>(value ? new Date(`${value.to}T00:00:00`) : undefined);
  const [error, setError] = useState("");
  const formatDate = (date?: Date) => date ? date.toLocaleDateString("en-GB").replace(/\//g, "-") : "dd-mm-yyyy";
  const apply = () => {
    if (!fromDate && !toDate) { onApply(null); return; }
    const from = fromDate ?? toDate!;
    const to = toDate ?? fromDate!;
    if (from > to) { setError("The From date must be before the To date."); return; }
    onApply({ label: `${formatDate(from)} → ${formatDate(to)}`, from: ymd(from), to: ymd(to) });
  };
  // To can't be before From (and the other way round), and neither can be in the future.
  const today = new Date();
  const pickerValue = (picker === "from" ? fromDate : toDate) ?? (picker === "to" && fromDate ? fromDate : today);
  const pickerMin = picker === "to" ? fromDate : undefined;
  const pickerMax = picker === "from" && toDate ? toDate : today;
  const calendarOnly = !!picker && Platform.OS === "ios";
  const choose = (date?: Date) => {
    const which = picker;
    setPicker("");
    if (!date) return;
    setError("");
    if (which === "from") setFromDate(date); else setToDate(date);
  };
  return (
    <View style={transactionUi.overlay}>
      <Pressable onPress={onClose} style={transactionUi.overlayTap} />
      <SlideUpSheet onClose={onClose} style={transactionUi.filterSheet} scrollable>
        <View style={transactionUi.handle} />
        <View style={transactionUi.filterHead}>
          <Text style={transactionUi.filterTitle}>{calendarOnly ? (picker === "from" ? "From date" : "To date") : "Filter by date"}</Text>
          <Pressable onPress={calendarOnly ? () => setPicker("") : onClose} style={transactionUi.close}>
            <Text style={transactionUi.closeText}>×</Text>
          </Pressable>
        </View>
        {/* iOS: picking a date shows only the calendar, then returns to From/To.
            Android opens its own calendar dialog over this panel instead. */}
        {calendarOnly ? (
          <View style={transactionUi.calendarWrap}>
            <DateTimePicker value={pickerValue} mode="date" display="inline" themeVariant="light" accentColor="#5C70FF" minimumDate={pickerMin} maximumDate={pickerMax} onChange={(_, date) => choose(date)} />
          </View>
        ) : <>
          <View style={transactionUi.dateInputs}>
            <Pressable onPress={() => setPicker("from")} style={transactionUi.dateInput}>
              <Text style={transactionUi.dateLabel}>FROM</Text>
              <Text style={[transactionUi.dateValue, !fromDate && transactionUi.datePlaceholder]}>{formatDate(fromDate)}</Text>
            </Pressable>
            <Text style={transactionUi.arrow}>→</Text>
            <Pressable onPress={() => setPicker("to")} style={transactionUi.dateInput}>
              <Text style={transactionUi.dateLabel}>TO</Text>
              <Text style={[transactionUi.dateValue, !toDate && transactionUi.datePlaceholder]}>{formatDate(toDate)}</Text>
            </Pressable>
          </View>
          {!!error && <Text style={transactionUi.filterError}>{error}</Text>}
          <Pressable onPress={apply} style={transactionUi.applyFull}>
            <Text style={transactionUi.applyText}>Apply</Text>
          </Pressable>
        </>}
        {!!picker && Platform.OS !== "ios" && <DateTimePicker value={pickerValue} mode="date" display="calendar" minimumDate={pickerMin} maximumDate={pickerMax} onChange={(_, date) => choose(date)} />}
      </SlideUpSheet>
    </View>
  );
}

function MarqueeName({ text }: { text: string }) {
  return <ContinuousMarquee text={text} clipStyle={listUi.nameClip} textStyle={listUi.name} />;
}
function Bills({ transactions, onRefresh }: { transactions: FinanceTransaction[]; onRefresh?: () => Promise<void> }) {
  const refreshControl = usePullRefresh(onRefresh);
  const [attached, setAttached] = useState(false);
  const missing = transactions.filter((transaction) => transaction.billStatus === 'missing');
  const attachedBills = transactions.filter((transaction) => transaction.billStatus === 'attached');
  const shown = attached ? attachedBills : missing;
  const list = useIncrementalList(shown, `${attached}|${shown.length}`);
  const [switching, showSwitching] = useBriefLoading();
  return (
    <View style={{ flex: 1, backgroundColor: "#F4F6FA" }}>
      <View style={listUi.billsHeader}>
        <View style={listUi.pageTitleRow}>
          <View><Text style={listUi.pageTitle}>Bills</Text><Text style={listUi.pageSubtitle}>{missing.length} of {transactions.length} transactions need a bill</Text></View>
        </View>
        <View style={listUi.tabs}>
          <Pressable
            onPress={() => { setAttached(false); showSwitching(); }}
            style={[listUi.tab, !attached && listUi.tabActive]}
          >
            <Text style={[listUi.tabText, !attached && listUi.tabTextActive]}>
              Missing  <Text style={listUi.tabCountMissing}>{missing.length}</Text>
            </Text>
          </Pressable>
          <Pressable
            onPress={() => { setAttached(true); showSwitching(); }}
            style={[listUi.tab, attached && listUi.tabActive]}
          >
            <Text style={[listUi.tabText, attached && listUi.tabTextActive]}>
              Attached  <Text style={listUi.tabCountAttached}>{attachedBills.length}</Text>
            </Text>
          </Pressable>
        </View>
      </View>
      <ScrollView refreshControl={refreshControl} contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: 120 }} onScroll={list.onScroll} scrollEventThrottle={150}>
          {switching && <BillCardsSkeleton />}
          {!switching && list.visible.map((transaction) => {
            return <View key={transaction.id} style={listUi.billCard}>
              <View style={[listUi.billTile, !attached && listUi.billTileMissing]}>{attached ? <ReceiptText size={25} color="#FFF" /> : <Text style={listUi.billPlus}>＋</Text>}</View>
              <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                <TransactionLines title={<MarqueeName text={transaction.merchant} />} amount={money(transaction.amount)} amountStyle={listUi.amount} meta={`${transaction.postedLabel} · ${transaction.category}`} hasBill={attached} />
              </View>
            </View>;
          })}
          {!switching && !shown.length && <Text style={{ color: '#71809A', textAlign: 'center', marginTop: 28 }}>No {attached ? 'attached' : 'missing'} bills.</Text>}
          <ListFooterLoader hasMore={!switching && list.hasMore} />
      </ScrollView>
    </View>
  );
}
const transactionUi = StyleSheet.create({
  tools: { flexDirection: "row", alignItems: "center", gap: 10 },
  galleryIcon: { width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  galleryTile: { width: 50, height: 50, borderRadius: 15, backgroundColor: "#14203B", alignItems: "center", justifyContent: "center" },
  screen: { padding: 16, paddingTop: 18, paddingBottom: 112 },
  titleRow: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  title: { fontSize: 25, fontWeight: "800", color: "#17223A" },
  rangeBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EEF0FF", borderWidth: 1, borderColor: "#D9DEFF", borderRadius: 12, paddingVertical: 7, paddingLeft: 12, paddingRight: 6, marginBottom: 12 },
  rangeText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#17223A" },
  rangeCount: { color: "#5C6B87", fontWeight: "600" },
  rangeClear: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#D9DEFF" },
  rangeClearText: { color: "#5C70FF", fontSize: 13, fontWeight: "800" },
  billTabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E6EAF2", marginBottom: 14 },
  billTab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  billTabText: { fontSize: 16, fontWeight: "700", color: "#9AA5BB" },
  billTabTextOn: { color: "#101A32", fontWeight: "800" },
  billTabIndicator: { position: "absolute", left: 0, right: 0, bottom: -1, height: 3, borderRadius: 2, backgroundColor: "#5C70FF" },
  toolActive: { borderColor: "#5C70FF", backgroundColor: "#EEF0FF" },
  applyFull: { height: 46, borderRadius: 12, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center", marginTop: 14 },
  filterError: { color: "#D9363E", fontSize: 13, textAlign: "center", marginTop: 10 },
  tool: {
    height: 50,
    width: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E0E5EF",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  searchHint: { fontSize: 17, color: "#9AA6BD" },
  check: {
    height: 19,
    width: 19,
    borderRadius: 10,
    backgroundColor: "#159148",
    borderWidth: 2,
    borderColor: "#FFF",
    position: "absolute",
    right: -6,
    bottom: -6,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { fontSize: 11, color: "#FFF", fontWeight: "700" },
  overlay: {
    position: "absolute",
    top: (NativeStatusBar.currentHeight ?? 0) / UI_SCALE,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(20,30,50,.38)",
    justifyContent: "flex-end",
  },
  overlayTap: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
  filterSheet: { backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 22 },
  handle: { height: 4, width: 44, borderRadius: 3, backgroundColor: "#E3E7F0", alignSelf: "center", marginBottom: 12 },
  filterHead: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  filterTitle: { fontSize: 19, fontWeight: "800", color: "#17223A" },
  close: { height: 34, width: 34, borderRadius: 10, borderWidth: 1, borderColor: "#E0E5EF", alignItems: "center", justifyContent: "center", marginLeft: "auto" },
  closeText: { fontSize: 22, color: "#17223A", marginTop: -2 },
  dateInputs: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateInput: { flex: 1, minHeight: 52, borderRadius: 12, backgroundColor: "#F7F8FB", borderWidth: 1, borderColor: "#E1E6EF", paddingHorizontal: 12, paddingVertical: 8, justifyContent: "center" },
  dateLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, color: "#98A4BA" },
  datePlaceholder: { color: "#A9B3C6", fontWeight: "400" },
  calendarWrap: { borderRadius: 14, borderWidth: 1, borderColor: "#E1E6EF", backgroundColor: "#FFF", overflow: "hidden" },
  dateValue: { fontSize: 15, fontWeight: "600", color: "#17223A", marginTop: 2 },
  arrow: { fontSize: 18, color: "#95A1B8" },
  applyText: { fontSize: 16, fontWeight: "800", color: "#FFF" },
  calendar: { position: "absolute", left: 26, right: 26, bottom: 120, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#C8D0E0", borderRadius: 14, padding: 16, elevation: 8, shadowColor: "#17223A", shadowOpacity: 0.18, shadowRadius: 10 },
  calendarHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  calendarTitle: { fontSize: 16, fontWeight: "700", color: "#17223A" },
  calendarClose: { fontSize: 24, color: "#5C70FF" },
  week: { fontSize: 14, color: "#6D7990", letterSpacing: 2, marginBottom: 10 },
  days: { fontSize: 15, color: "#17223A", letterSpacing: 3, lineHeight: 30 },
});

const listUi = StyleSheet.create({
  billsHeader: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 0 },
  pageTitleRow: { minHeight: 62, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  pageTitle: { fontSize: 25, lineHeight: 30, fontWeight: "800", color: "#17223A" },
  pageSubtitle: { fontSize: 14, color: "#8290A8", marginTop: 3 },
  newBill: { height: 48, borderRadius: 15, backgroundColor: "#5C70FF", paddingHorizontal: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  newBillText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  statusMissing: { backgroundColor: "#FDEBEC" },
  statusMissingText: { color: "#E13B48" },
  statusAttached: { backgroundColor: "#EAF6EF" },
  statusAttachedText: { color: "#159148" },
  search: {
    height: 64,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E0E5EF",
    backgroundColor: "#FFF",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  searchText: { fontSize: 17, color: "#9AA6BD" },
  transactionCard: {
    minHeight: 102,
    borderWidth: 1,
    borderColor: "#E1E6EF",
    borderRadius: 23,
    backgroundColor: "#FFF",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  dateBox: {
    width: 66,
    height: 66,
    borderRadius: 18,
    backgroundColor: "#F1F3F8",
    alignItems: "center",
    justifyContent: "center",
  },
  month: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.7,
    color: "#98A4BA",
  },
  day: { fontSize: 23, fontWeight: "700", color: "#202A40", marginTop: 1 },
  name: { fontSize: 16, fontWeight: "700", color: "#1E2940" },
  nameClip: { height: 23, overflow: "hidden", justifyContent: "center" },
  meta: { fontSize: 14, color: "#71809A", marginTop: 3 },
  amount: { fontSize: 16, fontWeight: "700", color: "#1E2940" },
  categoryTag: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 3,
    marginTop: 7,
  },
  categoryText: { fontSize: 14, fontWeight: "600" },
  billStatus: { fontSize: 14, fontWeight: "600" },
  tabs: {
    height: 54,
    borderRadius: 16,
    padding: 5,
    backgroundColor: "#E8ECF6",
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#FFF",
    shadowColor: "#1E2940",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "700", color: "#71809A" },
  tabCountMissing: { color: "#E13B48", fontSize: 12, fontWeight: "800" },
  tabCountAttached: { color: "#159148", fontSize: 12, fontWeight: "800" },
  tabTextActive: { color: "#1E2940" },
  billCard: {
    height: 84,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E1E6EF",
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  billTile: {
    height: 50,
    width: 48,
    borderRadius: 15,
    backgroundColor: "#121B34",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
  },
  billTileMissing: { backgroundColor: "#FFF", borderWidth: 2, borderStyle: "dashed", borderColor: "#CBD4E6" },
  billPlus: { color: "#7B89A6", fontSize: 23, fontWeight: "300" },
  billCheck: { position: "absolute", bottom: -5, right: -5, width: 21, height: 21, borderRadius: 12, backgroundColor: "#159148", borderWidth: 2, borderColor: "#FFF", alignItems: "center", justifyContent: "center" },
  billCheckText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
  billInfo: {
    flex: 1,
    minWidth: 0,
    height: 46,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: "center",
  },
  billAmountArea: { width: 122, height: 46, alignItems: "flex-end", justifyContent: "flex-start", gap: 5, flexShrink: 0 },
});

function Home({
  onBusiness,
  onTransactions,
  onImport,
}: {
  onBusiness: () => void;
  onTransactions: () => void;
  onImport: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.selectRow}>
        <Selector
          label="BUSINESS"
          value="▥  Westside Retail"
          onPress={onBusiness}
        />
        <Selector label="BANK ACCOUNT" value="▱  RBC **** 5614" />
      </View>
      <View style={s.spend}>
        <View>
          <Text style={s.cardLabel}>TOTAL SPENT</Text>
          <Text style={s.spendNum}>$22,895.27</Text>
        </View>
        <Text style={s.period}>This month⌄</Text>
      </View>
      <View style={s.stats}>
        <Stat title="Categories" value="8" icon="◇" />
        <Stat title="Missing receipts" value="4" icon="▧" />
      </View>
      <View style={s.actions}>
        <Pressable onPress={onImport} style={s.upload}>
          <Text style={s.white}>↥ Upload CSV</Text>
        </Pressable>
        <View style={s.export}>
          <Text style={s.dark}>⇩ Export</Text>
        </View>
      </View>
      <View style={s.head}>
        <Text style={s.headTitle}>Recent transactions</Text>
        <Text style={s.hint}>This month</Text>
        <Pressable onPress={onTransactions}>
          <Text style={s.see}>See all ›</Text>
        </Pressable>
      </View>
      <View style={s.list}>
        {tx.slice(0, 4).map((x, i) => (
          <Tx key={x[0]} x={x} compact />
        ))}
      </View>
    </ScrollView>
  );
}
function Selector({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <View style={s.selector}>
      <Text style={s.selectorLabel}>{label}</Text>
      <Pressable onPress={onPress} style={s.selectorBox}>
        <Text style={s.selectorValue}>{value}</Text>
        <Text style={s.arrow}>⌄</Text>
      </Pressable>
    </View>
  );
}
function Stat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <View style={s.stat}>
      <Text style={s.statTitle}>{title}</Text>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statNum}>{value}</Text>
    </View>
  );
}
function Transactions({
  expanded,
  onExpand,
  onDetails,
}: {
  expanded: boolean;
  onExpand: () => void;
  onDetails: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.search}>
        <Text style={s.searchI}>⌕</Text>
        <Text style={s.searchText}>Search transactions</Text>
      </View>
      {tx.map((x, i) => (
        <Tx
          key={x[0]}
          x={x}
          expanded={i === 0 && expanded}
          onPress={i === 0 ? (expanded ? onDetails : onExpand) : undefined}
        />
      ))}
    </ScrollView>
  );
}
function Tx({
  x,
  compact,
  expanded,
  onPress,
}: {
  x: string[];
  compact?: boolean;
  expanded?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.tx,
        { borderColor: x[3] + "45" },
        compact && s.txCompact,
        expanded && s.txOpen,
      ]}
    >
      <View style={[s.accent, { backgroundColor: x[3] }]} />
      {compact && (
        <View style={[s.txIcon, { backgroundColor: x[3] + "18" }]}>
          <Text style={{ color: x[3] }}>◇</Text>
        </View>
      )}
      <View style={[s.txInfo, compact && { marginLeft: 13 }]}>
        <Text style={s.merchant}>{x[0]}</Text>
        <Text style={s.meta}>{x[1]}</Text>
      </View>
      <Text style={s.amount}>{x[2]}</Text>
      {!compact && <Text style={s.chev}>{expanded ? "⌃" : "⌄"}</Text>}
      {expanded && (
        <View style={s.details}>
          <View style={s.detailLine} />
          <View style={s.detailFields}>
            <View style={[s.field, { flex: 1.35 }]}>
              <Text style={s.fieldLab}>CATEGORY</Text>
              <Text style={s.fieldVal}>Inventory ⌄</Text>
            </View>
            <View style={s.field}>
              <Text style={s.fieldLab}>GST</Text>
              <Text style={s.fieldVal}>199.17 5%</Text>
            </View>
            <View style={s.field}>
              <Text style={s.fieldLab}>PST</Text>
              <Text style={s.fieldVal}>0.00</Text>
            </View>
          </View>
          <Text style={[s.fieldLab, { marginTop: 16 }]}>MEMO</Text>
          <View style={s.memo}>
            <Text style={s.memoText}>Weekly inventory restock — PO 44182</Text>
            <Text style={s.bill}>☁ Bill</Text>
          </View>
          <Text style={s.viewDetails}>View details</Text>
        </View>
      )}
    </Pressable>
  );
}
function Receipts({ onUpload }: { onUpload: () => void }) {
  const names = [
    "Northline Wholesale Sup…",
    "Telus Business",
    "Coastal Marketing Co-op",
    "Staples Business",
  ];
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Tabs labels={["Missing (4)", "Attached (6)"]} />
      {names.map((n, i) => (
        <View style={s.receipt} key={n}>
          <View style={s.miss}>
            <Text style={s.missText}>▧</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.merchant}>{n}</Text>
            <Text style={s.meta}>
              {
                [
                  "Sep 1 · -$318.44",
                  "Aug 30 · -$164.85",
                  "Aug 27 · -$540.00",
                  "Aug 24 · -$142.77",
                ][i]
              }
            </Text>
          </View>
          <Pressable onPress={onUpload} style={s.upBtn}>
            <Text style={s.white}>☁ Upload</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
function AnalyticsHeader({ title, onBack, onFilter, filterActive = false }: { title: string; onBack: () => void; onFilter: () => void; filterActive?: boolean }) {
  return <View style={analytics.header}><BackButton onPress={onBack} /><Text style={analytics.title}>{title}</Text><Pressable onPress={onFilter} style={[analytics.headerButton, analytics.filterButton, filterActive && analytics.filterButtonActive]} accessibilityLabel="Filter by date"><Search size={25} color={filterActive ? "#5C70FF" : "#17223A"} /></Pressable></View>;
}


const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CHART_COLORS = ["#3B82F6", "#10A06D", "#F59E0B", "#EF4444", "#8B5CF6", "#64748B", "#0EA5E9", "#EC4899", "#14B8A6", "#94A3B8"];

/** Nice round axis maximum and 4 steps, e.g. 38k → 40k. */
function chartScale(max: number) {
  const raw = Math.max(max, 1) / 4;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((n) => n * power).find((n) => n >= raw) ?? raw;
  return { top: step * 4, ticks: [0, 1, 2, 3, 4].map((n) => n * step) };
}

/** Vertical coloured bars, like OATRx "Top Spending Categories". */
function CategoryBarChart({ items }: { items: Array<{ name: string; amount: number }> }) {
  const [width, setWidth] = useState(0);
  const height = 250, left = 46, bottom = 88, top = 12;
  const { top: maxValue, ticks } = chartScale(Math.max(...items.map((item) => item.amount), 0));
  const plotWidth = Math.max(0, width - left - 8);
  const plotHeight = height - top - bottom;
  const slot = items.length ? plotWidth / items.length : 0;
  const barWidth = Math.min(34, slot * 0.6);
  const y = (value: number) => top + plotHeight - (value / maxValue) * plotHeight;
  return <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ marginTop: 18 }}>
    {width > 0 && <Svg width={width} height={height}>
      {ticks.map((tick) => <SvgLine key={tick} x1={left} x2={width - 8} y1={y(tick)} y2={y(tick)} stroke="#E8ECF3" strokeDasharray="4 4" />)}
      {ticks.map((tick) => <SvgText {...svgFont(400)} key={`l${tick}`} x={left - 6} y={y(tick) + 4} fontSize={11} fill="#8A96AC" textAnchor="end">{compactMoney(tick)}</SvgText>)}
      <SvgLine x1={left} x2={width - 8} y1={y(0)} y2={y(0)} stroke="#C9D1DF" />
      {items.map((item, index) => {
        const x = left + slot * index + (slot - barWidth) / 2;
        const barTop = y(item.amount);
        const cx = left + slot * index + slot / 2;
        const label = item.name.length > 16 ? `${item.name.slice(0, 15)}…` : item.name;
        return <Fragment key={item.name}>
          <SvgRect x={x} y={barTop} width={barWidth} height={Math.max(1.5, y(0) - barTop)} rx={4} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          <SvgText {...svgFont(400)} x={cx} y={y(0) + 12} fontSize={10.5} fill="#5B6882" textAnchor="end" transform={`rotate(-45 ${cx} ${y(0) + 12})`}>{label}</SvgText>
        </Fragment>;
      })}
    </Svg>}
  </View>;
}

/** Smooth line with points, like OATRx "Monthly Spending Trend". */
function MonthlyLineChart({ items }: { items: Array<{ key: string; label: string; amount: number }> }) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const height = 250, left = 46, right = 18, top = 16, bottom = 34;
  const { top: maxValue, ticks } = chartScale(Math.max(...items.map((item) => item.amount), 0));
  const plotWidth = Math.max(0, width - left - right);
  const plotHeight = height - top - bottom;
  const x = (index: number) => left + (items.length > 1 ? (plotWidth * index) / (items.length - 1) : plotWidth / 2);
  const y = (value: number) => top + plotHeight - (value / maxValue) * plotHeight;
  const points = items.map((item, index) => ({ x: x(index), y: y(item.amount) }));
  // Gentle curve through every point.
  const path = points.map((point, index) => {
    if (!index) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const mid = (point.x - previous.x) / 2;
    return `C ${previous.x + mid} ${previous.y} ${point.x - mid} ${point.y} ${point.x} ${point.y}`;
  }).join(' ');
  const labelEvery = Math.max(1, Math.ceil(items.length / Math.max(1, Math.floor(plotWidth / 64))));
  const active = selected !== null ? items[selected] : null;
  return <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ marginTop: 18 }}>
    {width > 0 && <Svg width={width} height={height}>
      {ticks.map((tick) => <SvgLine key={tick} x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} stroke="#E8ECF3" strokeDasharray="4 4" />)}
      {ticks.map((tick) => <SvgText {...svgFont(400)} key={`l${tick}`} x={left - 6} y={y(tick) + 4} fontSize={11} fill="#8A96AC" textAnchor="end">{compactMoney(tick)}</SvgText>)}
      <SvgLine x1={left} x2={width - right} y1={y(0)} y2={y(0)} stroke="#C9D1DF" />
      {points.length > 1 && <Path d={path} stroke="#3B82F6" strokeWidth={2.5} fill="none" />}
      {points.map((point, index) => <SvgCircle key={items[index].key} cx={point.x} cy={point.y} r={selected === index ? 7 : 5} fill="#3B82F6" stroke="#FFF" strokeWidth={2} onPress={() => setSelected(selected === index ? null : index)} />)}
      {items.map((item, index) => index % labelEvery === 0 || index === items.length - 1
        ? <SvgText {...svgFont(400)} key={`m${item.key}`} x={x(index)} y={height - 10} fontSize={11} fill="#5B6882" textAnchor={index === 0 && items.length > 1 ? "start" : index === items.length - 1 && items.length > 1 ? "end" : "middle"}>{item.label}</SvgText>
        : null)}
    </Svg>}
    <Text style={analytics.chartHint}>{active ? `${active.label}: ${money(active.amount)}` : "Tap a point to see the month total"}</Text>
  </View>;
}

function compactMoney(value: number) {
  const amount = Math.abs(value);
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(amount)}`;
}

function Charts({ workspace, selectedBankId, onBusiness, onBank, onBack, onRefresh }: { onRefresh?: () => Promise<void>; workspace: Workspace | null; selectedBankId: string | null; onBusiness: () => void; onBank: () => void; onBack: () => void }) {
  // Placeholders for a moment each time the page opens.
  const [opening, setOpening] = useState(true);
  useEffect(() => { const timer = setTimeout(() => setOpening(false), 500); return () => clearTimeout(timer); }, []);
  const refreshControl = usePullRefresh(onRefresh);
  const bank = workspace?.bankAccounts.find((account) => account.id === selectedBankId);
  const [filterOpen, setFilterOpen] = useState(false);
  useBackHandler(filterOpen, () => setFilterOpen(false));
  const [range, setRange] = useState<DateRange | null>(null);
  // Same as OATRx: every transaction of the chosen bank (and dates) is counted.
  const transactions = useMemo(() => (workspace?.transactions ?? []).filter((item) => (!selectedBankId || item.bankAccountId === selectedBankId) && (!range || inDateRange(item.postedOn, range))), [workspace?.transactions, selectedBankId, range]);
  const spent = transactions.reduce((sum, item) => sum + Math.abs(numberValue(item.amount)), 0);
  const categories = useMemo(() => Object.entries(transactions.reduce<Record<string, number>>((result, item) => {
    const name = item.category || "Uncategorized";
    result[name] = (result[name] ?? 0) + Math.abs(numberValue(item.amount));
  return result;
  }, {})).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 10), [transactions]);
  // Monthly totals for every month in the data, oldest first (OATRx "Monthly Spending Trend").
  const months = useMemo(() => Object.entries(transactions.reduce<Record<string, number>>((result, item) => {
    const key = String(item.postedOn).slice(0, 7);
    result[key] = (result[key] ?? 0) + Math.abs(numberValue(item.amount));
    return result;
  }, {})).sort(([a], [b]) => a.localeCompare(b)).map(([key, amount]) => ({ key, label: `${MONTH_NAMES[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`, amount })), [transactions]);
  if (opening) return <ChartsSkeleton />;
  return <View style={[analytics.page, filterOpen && { zIndex: 20, elevation: 20 }]}>
    <ScrollView refreshControl={refreshControl} contentContainerStyle={analytics.screen} showsVerticalScrollIndicator={false}>
      <AnalyticsHeader title="Charts" onBack={onBack} onFilter={() => setFilterOpen(true)} filterActive={!!range} />
      <AnalyticsScope workspace={workspace} bank={bank} onBusiness={onBusiness} onBank={onBank} />
      {range ? <DateRangeBar range={range} count={transactions.length} onClear={() => setRange(null)} /> : <Text style={analytics.scopeText}>All dates · {transactions.length} {transactions.length === 1 ? "transaction" : "transactions"}</Text>}
      {!transactions.length ? <View style={analytics.card}><Text style={analytics.emptyText}>No transactions {range ? "in this date range" : "yet"}.</Text></View> : <>
        <View style={analytics.card}>
          <Text style={analytics.eyebrow}>Top Spending Categories</Text>
          <View style={analytics.totalLine}><Text style={analytics.total}>{money(spent)}</Text><Text style={analytics.categoryCount}>top {categories.length}</Text></View>
          <CategoryBarChart items={categories} />
        </View>
        <View style={[analytics.card, analytics.monthCard]}>
          <Text style={analytics.eyebrow}>Monthly Spending Trend</Text>
          <View style={analytics.monthTotalRow}><Text style={analytics.total}>{money(spent)}</Text><Text style={analytics.average}>{months.length} {months.length === 1 ? "month" : "months"}</Text></View>
          <MonthlyLineChart items={months} />
        </View>
      </>}
    </ScrollView>
    {filterOpen && <DateFilter value={range} onApply={(next) => { setRange(next); setFilterOpen(false); }} onClose={() => setFilterOpen(false)} />}
  </View>;
}
function Tabs({ labels }: { labels: string[] }) {
  return (
    <View style={s.tabs}>
      {labels.map((l, i) => (
        <View key={l} style={[s.tab, i === 0 && s.tabOn]}>
          <Text style={[s.tabText, i === 0 && s.tabTextOn]}>{l}</Text>
        </View>
      ))}
    </View>
  );
}
function AnalyticsScope({ workspace, bank, onBusiness, onBank }: { workspace: Workspace | null; bank?: Workspace['bankAccounts'][number]; onBusiness: () => void; onBank: () => void }) {
  return (
    <View style={analytics.selectors}>
      <Pressable onPress={onBusiness} style={analytics.selector} accessibilityRole="button" accessibilityLabel="Change business">
        <Text style={analytics.selectorLabel}>BUSINESS</Text>
        <View style={analytics.selectorValue}><BusinessLogo business={workspace?.activeBusiness} size={24} fallback={<Building2 size={18} color="#71809A" />} /><ContinuousMarquee text={workspace?.activeBusiness?.name ?? "No business"} clipStyle={analytics.selectorMarqueeClip} textStyle={analytics.selectorMarqueeText} /><ChevronDown size={18} color="#8F9AB0" /></View>
      </Pressable>
      <Pressable onPress={onBank} style={analytics.selector} accessibilityRole="button" accessibilityLabel="Change bank account">
        <Text style={analytics.selectorLabel}>BANK ACCOUNT</Text>
        <View style={analytics.selectorValue}><Landmark size={18} color="#71809A" /><ContinuousMarquee text={bank ? `${bank.name} ${bank.maskedNumber}` : "All accounts"} clipStyle={analytics.selectorMarqueeClip} textStyle={analytics.selectorMarqueeText} /><ChevronDown size={18} color="#8F9AB0" /></View>
      </Pressable>
    </View>
  );
}

function Reports({ workspace, selectedBankId, onBusiness, onBank, onBack }: { workspace: Workspace | null; selectedBankId: string | null; onBusiness: () => void; onBank: () => void; onBack: () => void }) {
  // Placeholders for a moment each time the page opens.
  const [opening, setOpening] = useState(true);
  useEffect(() => { const timer = setTimeout(() => setOpening(false), 500); return () => clearTimeout(timer); }, []);
  const [filterOpen, setFilterOpen] = useState(false);
  useBackHandler(filterOpen, () => setFilterOpen(false));
  const [range, setRange] = useState<DateRange | null>(null);
  const bank = workspace?.bankAccounts.find((account) => account.id === selectedBankId);
  const transactions = useMemo(() => (workspace?.transactions ?? []).filter((item) => (!selectedBankId || item.bankAccountId === selectedBankId) && (!range || inDateRange(item.postedOn, range))), [workspace?.transactions, selectedBankId, range]);
  const report = transactionSummary(transactions);
  if (opening) return <ChartsSkeleton />;
  return <View style={[analytics.page, filterOpen && { zIndex: 20, elevation: 20 }]}>
    <ScrollView contentContainerStyle={analytics.screen} showsVerticalScrollIndicator={false}>
      <AnalyticsHeader title="Reports" onBack={onBack} onFilter={() => setFilterOpen(true)} filterActive={!!range} />
      <AnalyticsScope workspace={workspace} bank={bank} onBusiness={onBusiness} onBank={onBank} />
      {range && <DateRangeBar range={range} count={transactions.length} onClear={() => setRange(null)} />}
      <LinearGradient colors={["#121B35", "#12203B", "#33449A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={analytics.reportSummary}>
        <View style={analytics.summaryDate}><CalendarDays size={19} color="#B3BED7" /><Text style={analytics.summaryDateText}>{range ? range.label : "All dates"}</Text></View>
        <Text style={analytics.reportAmount}>{money(report.spent)}</Text>
        <Text style={analytics.reportCaption}>Total spending · {workspace?.activeBusiness?.name ?? "No business"} · {bank?.maskedNumber ?? "All accounts"}</Text>
        <View style={analytics.summaryDivider} />
        <View style={analytics.summaryStats}>
          <View style={analytics.summaryStat}><Text style={analytics.summaryLabel}>Transactions</Text><Text style={analytics.summaryValue}>{report.transactionCount}</Text></View>
          <View style={analytics.summaryStat}><Text style={analytics.summaryLabel}>GST claimable</Text><Text style={analytics.summaryValue}>{money(report.gstClaimable)}</Text></View>
          <View style={analytics.summaryStat}><Text style={analytics.summaryLabel}>Bills missing</Text><Text style={[analytics.summaryValue, { color: "#FFA7B0" }]}>{report.billsMissing}</Text></View>
        </View>
      </LinearGradient>
      <View style={analytics.exportCard}><View style={analytics.exportTop}><View style={analytics.exportIcon}><FileText size={26} color="#5C70FF" /></View><View style={{ flex: 1 }}><Text style={analytics.exportTitle}>Transactions report</Text><Text style={analytics.exportHint}>Date, remarks, amount, category, GST, PST, bill status</Text></View></View></View>
    </ScrollView>
    {filterOpen && <DateFilter value={range} onApply={(next) => { setRange(next); setFilterOpen(false); }} onClose={() => setFilterOpen(false)} />}
  </View>;
}
function SmallStat({ label, val }: { label: string; val: string }) {
  return (
    <View style={s.smallStat}>
      <Text style={s.chartCap}>{label}</Text>
      <Text style={s.smallVal}>{val}</Text>
    </View>
  );
}

const analytics = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F4F6FA" },
  screen: { padding: 16, paddingTop: 18, paddingBottom: 124 },
  header: { height: 62, flexDirection: "row", alignItems: "center", marginBottom: 18 },
  headerButton: { height: 48, width: 48, borderRadius: 15, borderWidth: 1, borderColor: "#E0E5EF", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  back: { fontSize: 31, lineHeight: 34, color: "#17223A", marginTop: -5 },
  title: { marginLeft: 16, fontSize: 27, fontWeight: "800", color: "#101A32" },
  filterButton: { marginLeft: "auto" },
  filterButtonActive: { borderColor: "#5C70FF", backgroundColor: "#EEF0FF" },
  scopeText: { color: "#71809A", fontWeight: "700", marginBottom: 12 },
  emptyText: { color: "#71809A", fontSize: 15, textAlign: "center" },
  categoryShare: { color: "#8290A8", fontSize: 13, fontWeight: "600" },
  card: { borderWidth: 1, borderColor: "#E0E5EF", borderRadius: 26, backgroundColor: "#FFF", padding: 26, marginBottom: 20 },
  eyebrow: { fontSize: 15, color: "#71809A" },
  totalLine: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 7, marginBottom: 22 },
  total: { color: "#101A32", fontSize: 34, lineHeight: 40, fontWeight: "800" },
  categoryCount: { color: "#94A0B8", fontSize: 15, marginBottom: 4 },
  categoryRow: { marginBottom: 14 },
  categoryTextRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  categoryName: { color: "#101A32", fontSize: 16, fontWeight: "700" },
  categoryAmount: { color: "#101A32", fontSize: 16, fontWeight: "700" },
  track: { height: 9, backgroundColor: "#EDF0FA", borderRadius: 5, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 5, backgroundColor: "#304394" },
  monthCard: { paddingBottom: 20 },
  chartHint: { color: '#71809A', fontSize: 13, textAlign: 'center', marginTop: 6 },
  monthTotalRow: { flexDirection: "row", alignItems: "baseline", gap: 9, marginTop: 7 },
  average: { color: "#94A0B8", fontSize: 14 },
  bars: { height: 280, marginTop: 28, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", borderBottomWidth: 1, borderColor: "#E5E9F2" },
  barColumn: { height: "100%", flex: 1, alignItems: "center", justifyContent: "flex-end" },
  barValue: { color: "#71809A", fontSize: 13, marginBottom: 12 },
  barWrap: { height: 198, width: "100%", justifyContent: "flex-end", alignItems: "center" },
  bar: { width: 45, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  barMonth: { color: "#71809A", fontSize: 14, marginTop: 13, marginBottom: 2 },
  selectors: { flexDirection: "row", gap: 12, marginBottom: 14 },
  selector: { flex: 1, minWidth: 0 },
  selectorLabel: { color: "#8A96AC", fontSize: 13, fontWeight: "800", marginBottom: 6 },
  selectorValue: { height: 54, borderRadius: 16, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E0E5EF", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  selectorMarqueeClip: { flex: 1, minWidth: 0, overflow: "hidden", justifyContent: "center" },
  selectorMarqueeText: { flexShrink: 0, color: "#17223A", fontSize: 15, fontWeight: "700" },
  reportSummary: { borderRadius: 24, padding: 20, paddingBottom: 18, marginBottom: 16 },
  summaryDate: { flexDirection: "row", alignItems: "center", gap: 10 },
  summaryDateText: { color: "#B4BED4", fontSize: 14 },
  reportAmount: { marginTop: 12, color: "#FFF", fontSize: 38, lineHeight: 44, fontWeight: "800" },
  reportCaption: { color: "#B4BED4", fontSize: 15, marginTop: 5 },
  summaryDivider: { height: 1, backgroundColor: "rgba(255,255,255,.18)", marginVertical: 16 },
  summaryStats: { flexDirection: "row" },
  summaryStat: { flex: 1, paddingRight: 8, borderRightWidth: 1, borderColor: "rgba(255,255,255,.16)", marginRight: 12 },
  summaryLabel: { color: "#B4BED4", fontSize: 13 },
  summaryValue: { color: "#FFF", fontSize: 24, fontWeight: "800", marginTop: 7 },
  exportCard: { minHeight: 174, borderWidth: 1, borderColor: "#E0E5EF", borderRadius: 22, backgroundColor: "#FFF", padding: 20 },
  exportTop: { flexDirection: "row", alignItems: "center" },
  exportIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: "#EEF0FF", alignItems: "center", justifyContent: "center", marginRight: 16 },
  exportTitle: { color: "#101A32", fontSize: 18, fontWeight: "800", marginTop: 4 },
  exportHint: { color: "#71809A", fontSize: 14, lineHeight: 20, marginTop: 5 },
});

function DetailPageHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: any }) {
  return <View style={pageUi.header}><BackButton onPress={onBack} /><Text style={pageUi.title}>{title}</Text>{action ? <View style={{ marginLeft: "auto" }}>{action}</View> : null}</View>;
}

function ProfilePage({ token, user, onUpdated, onBack }: { token: string; user: AuthSession['user'] | null; onUpdated: (user: AuthSession['user']) => void; onBack: () => void }) {
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState({ name: user?.name ?? "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  useAutoClear(message?.tone === "success", message, () => setMessage(null));
  useMessageHaptic(message?.text, message?.tone === "error");
  // Load the saved phone number so Save never overwrites it with an empty value.
  useEffect(() => {
    if (!token) return;
    let active = true;
    const startedAt = Date.now();
    void getProfile(token)
      .then(async (result) => { await new Promise((resolve) => setTimeout(resolve, Math.max(0, 500 - (Date.now() - startedAt)))); if (!active) return; setName(result.user.name); setPhone(result.phone); setSaved({ name: result.user.name, phone: result.phone }); })
      .catch((error) => { if (active) setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to load your profile." }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);
  const changed = name.trim() !== saved.name || phone.trim() !== saved.phone;
  const save = async () => {
    if (!name.trim()) { setMessage({ tone: "error", text: "Name cannot be empty." }); return; }
    setSaving(true);
    setMessage(null);
    try {
      const result = await updateProfile(token, { name: name.trim(), phone: phone.trim() });
      onUpdated(result.user);
      setName(result.user.name);
      setPhone(result.phone);
      setSaved({ name: result.user.name, phone: result.phone });
      setMessage({ tone: "success", text: "Profile saved." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to save your profile." });
    } finally {
      setSaving(false);
    }
  };
  const role = user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : "User";
  const initials = (user?.name ?? "").split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  return <ScrollView contentContainerStyle={pageUi.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <View style={bizUi.header}>
      <BackButton onPress={onBack} />
      <Text style={bizUi.title}>Profile</Text>
    </View>
    <View style={profileUi.card}>
      <DefaultAvatar size={60} radius={18} />
      <View style={{ flex: 1, minWidth: 0 }}>
        {user ? <Text numberOfLines={1} style={profileUi.name}>{user.name}</Text> : <TextSkeleton width={150} height={18} />}
        <Text numberOfLines={1} style={profileUi.email}>{user?.email ?? ""}</Text>
      </View>
      <Text style={profileUi.role}>{role}</Text>
    </View>
    {loading ? <FormSkeleton fields={3} style={{ marginTop: 8 }} /> : <>
      <View style={profileUi.form}>
        <Text style={profileUi.label}>Full name</Text>
        <TextInput value={name} onChangeText={(value) => { setName(value); setMessage(null); }} style={profileUi.input} placeholder="Your name" placeholderTextColor="#9AA6BF" />
        <Text style={[profileUi.label, profileUi.spaced]}>Email</Text>
        <TextInput value={user?.email ?? ""} editable={false} style={[profileUi.input, profileUi.inputDisabled]} />
        <Text style={[profileUi.label, profileUi.spaced]}>Phone</Text>
        <TextInput value={phone} onChangeText={(value) => { setPhone(value); setMessage(null); }} placeholder="Add phone number" placeholderTextColor="#9AA6BF" keyboardType="phone-pad" style={profileUi.input} />
      </View>
      {!!message && <Text style={[profileUi.message, message.tone === "success" ? profileUi.success : profileUi.error]}>{message.text}</Text>}
      <Pressable onPress={save} disabled={saving || !changed} style={[profileUi.save, (saving || !changed) && profileUi.saveDisabled]} accessibilityRole="button">
        <Text style={profileUi.saveText}>{saving ? "Saving…" : "Save changes"}</Text>
      </Pressable>
    </>}
  </ScrollView>;
}

const profileUi = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: "#E4E8F1", backgroundColor: "#FFF", marginBottom: 18, shadowColor: "#1B2A4E", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  avatar: { height: 60, width: 60, borderRadius: 18, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontSize: 21, fontWeight: "800" },
  name: { color: "#101A32", fontSize: 19, fontWeight: "800" },
  email: { color: "#71809A", fontSize: 15, marginTop: 3 },
  role: { color: "#4B5BE0", backgroundColor: "#EEF0FF", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, fontSize: 13, fontWeight: "800", overflow: "hidden" },
  form: { borderRadius: 22, borderWidth: 1, borderColor: "#E4E8F1", backgroundColor: "#FFF", padding: 18 },
  label: { color: "#17223A", fontSize: 15, fontWeight: "700", marginBottom: 8 },
  spaced: { marginTop: 18 },
  input: { height: 56, borderRadius: 16, borderWidth: 1, borderColor: "#E3E7EF", paddingHorizontal: 16, fontSize: 16, fontWeight: "600", color: "#17223A", backgroundColor: "#FFF" },
  inputDisabled: { backgroundColor: "#F7F8FC", color: "#71809A" },
  message: { fontSize: 14, fontWeight: "700", textAlign: "center", marginTop: 14 },
  success: { color: "#159148" },
  error: { color: "#D9363E" },
  save: { height: 56, borderRadius: 16, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center", marginTop: 20 },
  saveDisabled: { backgroundColor: "#A7B1FA" },
  saveText: { color: "#FFF", fontSize: 17, fontWeight: "800" },
});

type BusinessEditor =
  | { kind: "business"; businessId: string }
  | { kind: "account"; businessId: string; account: Workspace['bankAccounts'][number] }
  | { kind: "institution"; business: AuthSession['businesses'][number] };

function BusinessesPage({ token, workspace, businesses, canManage, switching = false, onSelect, onChanged, onBack, onAdd }: { switching?: boolean; token: string; workspace: Workspace | null; businesses: AuthSession['businesses']; canManage: boolean; onSelect: (businessId: string) => void; onChanged: (deletedBusinessId?: string) => void; onBack: () => void; onAdd: () => void }) {
  const { top: iosTop } = useIosInsets();
  const [accountsByBusiness, setAccountsByBusiness] = useState<Record<string, Workspace['bankAccounts']>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<BusinessEditor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ businessId: string; businessName?: string; account?: Workspace['bankAccounts'][number] } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const activeId = workspace?.activeBusiness?.id;
  const businessKey = businesses.map((business) => business.id).join(",");
  // Load every business's bank accounts in parallel, not just the active business.
  useEffect(() => {
    if (!token) return;
    let active = true;
    if (!reloadKey) setLoading(true);
    setError("");
    const startedAt = Date.now();
    void Promise.all(businesses.map((business) => getBusinessAccounts(token, business.id).then(({ accounts }) => [business.id, accounts] as const)))
      // Placeholders stay a moment so opening the page never flashes.
      .then(async (entries) => { await new Promise((resolve) => setTimeout(resolve, Math.max(0, 500 - (Date.now() - startedAt)))); if (active) setAccountsByBusiness(Object.fromEntries(entries)); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load bank accounts."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, businessKey, reloadKey]);
  const changed = () => { haptic.success(); setReloadKey((value) => value + 1); onChanged(); };
  useMessageHaptic(error, true);
  const refreshControl = usePullRefresh(async () => {
    try {
      const entries = await Promise.all(businesses.map((business) => getBusinessAccounts(token, business.id).then(({ accounts }) => [business.id, accounts] as const)));
      setAccountsByBusiness(Object.fromEntries(entries));
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load bank accounts."); }
    onChanged();
  });
  const removeAccount = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      if (confirmDelete.account) {
        await deleteBankAccount(token, confirmDelete.businessId, confirmDelete.account.id);
        setConfirmDelete(null);
        changed();
      } else {
        await deleteBusiness(token, confirmDelete.businessId);
        haptic.success();
        setConfirmDelete(null);
        setReloadKey((value) => value + 1);
        onChanged(confirmDelete.businessId);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : confirmDelete.account ? "Unable to delete the account." : "Unable to delete the business.");
      setConfirmDelete(null);
    } finally { setDeleting(false); }
  };
  const overlayOpen = !!editor || !!confirmDelete;
  useBackHandler(overlayOpen, () => { if (confirmDelete) { if (!deleting) setConfirmDelete(null); } else setEditor(null); });
  return <View style={[{ flex: 1 }, overlayOpen && { zIndex: 20, elevation: 20 }]}>
    <ScrollView refreshControl={refreshControl} contentContainerStyle={pageUi.screen} showsVerticalScrollIndicator={false}>
      <View style={bizUi.header}>
        <BackButton onPress={onBack} />
        <Text style={bizUi.title}>Businesses</Text>
        {canManage && <Pressable onPress={onAdd} style={bizUi.add} accessibilityRole="button"><Text style={bizUi.addText}>＋ Add</Text></Pressable>}
      </View>
      {!!error && <Text style={bizUi.error}>{error}</Text>}
      {(loading || switching) && <CardListSkeleton count={Math.min(Math.max(businesses.length, 2), 4)} />}
      {!loading && !switching && businesses.map((business) => {
        const isActive = business.id === activeId;
        const accounts = accountsByBusiness[business.id] ?? [];
        const initials = business.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
        const tint = BUSINESS_TINTS[Math.abs([...business.id].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % BUSINESS_TINTS.length];
        return <View style={[bizUi.card, isActive && bizUi.cardActive]} key={business.id}>
          <View style={bizUi.head}>
            <Pressable onPress={() => !isActive && onSelect(business.id)} style={bizUi.headMain} accessibilityRole="button" accessibilityLabel={isActive ? `${business.name}, active business` : `Switch to ${business.name}`}>
              {business.logoUpdatedAt
                ? <AuthImage token={token} url={businessLogoUrl(business.id)} cacheKey={`logo-${business.id}-${business.logoUpdatedAt}`} style={[bizUi.initials, { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E4E8F1" }]} />
                : <View style={[bizUi.initials, { backgroundColor: tint }]}><Text style={bizUi.initialsText}>{initials}</Text></View>}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={2} style={bizUi.name}>{business.name}</Text>
                <Text style={bizUi.meta}>{accounts.length} {accounts.length === 1 ? "account" : "accounts"}</Text>
              </View>
            </Pressable>
            {canManage && <View style={bizUi.headActions}>
              <Pressable onPress={() => setEditor({ kind: "business", businessId: business.id })} style={bizUi.ghostButton} hitSlop={6} accessibilityLabel={`Edit ${business.name}`}><Pencil size={17} color="#4B5BE0" /></Pressable>
              <Pressable onPress={() => setConfirmDelete({ businessId: business.id, businessName: business.name })} style={[bizUi.ghostButton, bizUi.ghostDanger]} hitSlop={6} accessibilityLabel={`Delete ${business.name}`}><Trash size={17} color="#E13B48" /></Pressable>
            </View>}
          </View>
          <View style={bizUi.accountsBox}>
            {accounts.map((account, index) => <View style={[bizUi.accountRow, index > 0 && bizUi.accountDivider]} key={account.id}>
              <View style={bizUi.logoTile}><InstitutionIcon accountType={account.accountType} cardType={account.cardType} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={bizUi.accountName}>{account.name}</Text>
                <View style={bizUi.accountMeta}>
                  <View style={bizUi.typeBadge}><Text numberOfLines={1} style={bizUi.typeBadgeText}>{account.accountType}</Text></View>
                  <Text numberOfLines={1} style={bizUi.accountNumber}>{compactMask(account.maskedNumber)}</Text>
                </View>
              </View>
              {canManage ? <View style={bizUi.rowActions}>
                <Pressable onPress={() => setEditor({ kind: "account", businessId: business.id, account })} style={bizUi.ghostSmall} hitSlop={6} accessibilityLabel={`Edit ${account.name}`}><Pencil size={15} color="#4B5BE0" /></Pressable>
                <Pressable onPress={() => setConfirmDelete({ businessId: business.id, account })} style={[bizUi.ghostSmall, bizUi.ghostDanger]} hitSlop={6} accessibilityLabel={`Delete ${account.name}`}><Trash size={15} color="#E13B48" /></Pressable>
              </View> : null}
            </View>)}
            {!accounts.length && <Text style={bizUi.noAccounts}>No bank accounts yet.</Text>}
          </View>
          {canManage && <Pressable onPress={() => setEditor({ kind: "institution", business })} style={({ pressed }) => [bizUi.addInstitution, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={`Add institution to ${business.name}`}>
            <Plus size={17} color="#4B5BE0" strokeWidth={2.4} /><Text style={bizUi.addInstitutionText}>Add institution</Text>
          </Pressable>}
        </View>;
      })}
      {!loading && !businesses.length && <Text style={{ textAlign: "center", color: "#71809A", marginTop: 36 }}>No businesses yet.</Text>}
    </ScrollView>
    {editor?.kind === "business" && <EditBusinessForm token={token} businessId={editor.businessId} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); changed(); }} />}
    {editor?.kind === "institution" && <View style={[bizUi.overlayPage, iosTop > 0 && { paddingTop: iosTop }]}><AddInstitution token={token} business={editor.business} hideBusiness onBack={() => setEditor(null)} onSaved={async () => { setEditor(null); changed(); }} /></View>}
    {editor?.kind === "account" && <EditAccountForm token={token} businessId={editor.businessId} account={editor.account} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); changed(); }} />}
    {confirmDelete && <View style={s.overlay}>
      <Pressable style={s.overlayTap} onPress={() => !deleting && setConfirmDelete(null)} />
      <SlideUpSheet style={uploadOptions.sheet}>
        <View style={s.handle} />
        <Text style={formUi.confirmTitle}>{confirmDelete.account ? "Delete this account?" : "Delete this business?"}</Text>
        <Text style={formUi.confirmText}>{confirmDelete.account ? `${confirmDelete.account.name} ${confirmDelete.account.maskedNumber} will be removed from this business. Past transactions and bills keep their history.` : `${confirmDelete.businessName} and its accounts will be removed from the app. Past transactions and bills keep their history.`}</Text>
        <View style={formUi.actions}>
          <Pressable onPress={() => setConfirmDelete(null)} disabled={deleting} style={formUi.secondary}><Text style={formUi.secondaryText}>Cancel</Text></Pressable>
          <Pressable onPress={() => void removeAccount()} disabled={deleting} style={[formUi.primary, formUi.danger]}><Text style={formUi.primaryText}>{deleting ? "Deleting…" : "Delete"}</Text></Pressable>
        </View>
      </SlideUpSheet>
    </View>}
  </View>;
}

// ---- Shared form building blocks for the business management screens ----
function FormScreen({ title, onClose, children, footer, overlay }: { title: string; onClose: () => void; children: any; footer: any; overlay?: any }) {
  const keyboardScroll = useKeyboardScroll(useRef<ScrollView>(null));
  // Full-screen form: starts below the iPhone status bar.
  const { top } = useIosInsets();
  return <View style={[pageForm.screen, top > 0 && { paddingTop: top }]}>
    <View style={billUpload.header}>
      <BackButton onPress={onClose} label="Back" />
      <Text style={billUpload.title}>{title}</Text>
    </View>
    <ScrollView {...keyboardScroll.scrollProps} contentContainerStyle={pageForm.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}<View style={{ height: keyboardScroll.keyboardSpace }} /></ScrollView>
    <View style={pageForm.footer}>{footer}</View>
    {overlay}
  </View>;
}

function FormField({ label, required, style, size, ...input }: { label: string; required?: boolean; style?: object; size?: "page" } & ComponentProps<typeof TextInput>) {
  const page = size === "page";
  return <View style={[{ flex: 1, minWidth: 0 }, style]}>
    <Text style={page ? pageForm.label : formUi.label}>{label}{required ? <Text style={{ color: "#E13B48" }}> *</Text> : null}</Text>
    <TextInput placeholderTextColor={page ? "#6D7990" : "#9AA6BF"} {...input} style={page ? pageForm.input : formUi.input} />
  </View>;
}

/** Text field with Google address suggestions (through the backend); falls back to plain typing. */
function AddressSearchField({ token, label, required, value, onChangeText, onSelect, size }: { size?: "page"; token: string; label: string; required?: boolean; value: string; onChangeText: (value: string) => void; onSelect: (address: { street: string; line2: string; city: string; province: string; postalCode: string }) => void }) {
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState("");
  // The text a picked suggestion put in the field; no new search runs until the user edits it.
  const picked = useRef<string | null>(null);
  const session = useRef(`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
  useEffect(() => {
    if (picked.current !== null && value === picked.current) { setSuggestions([]); setSearching(false); return; }
    const input = value.trim();
    if (!focused || input.length < 3 || !token) { setSuggestions([]); setSearching(false); return; }
    let active = true;
    setSearching(true);
    const timer = setTimeout(() => {
      void searchAddresses(token, input, session.current)
        .then((result) => { if (active) { setSuggestions(result.suggestions); setNotice(""); } })
        .catch((cause) => { if (active) { setSuggestions([]); setNotice(cause instanceof Error ? cause.message : "Address search is unavailable."); } })
        .finally(() => { if (active) setSearching(false); });
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [value, focused, token]);
  const choose = async (suggestion: AddressSuggestion) => {
    picked.current = suggestion.primary;
    onChangeText(suggestion.primary);
    setSuggestions([]);
    setFocused(false);
    Keyboard.dismiss();
    try {
      const { address } = await getAddressDetails(token, suggestion.placeId, session.current);
      picked.current = address.businessAddress || suggestion.primary;
      onSelect({ street: address.businessAddress || suggestion.primary, line2: streetLine(address), city: address.city, province: address.province, postalCode: address.postalCode });
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Unable to load that address.");
    } finally {
      session.current = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }
  };
  const page = size === "page";
  return <View style={{ flex: 1, minWidth: 0 }}>
    <Text style={page ? pageForm.label : formUi.label}>{label}{required ? <Text style={{ color: "#E13B48" }}> *</Text> : null}</Text>
    <View style={{ justifyContent: "center" }}>
      <TextInput value={value} onChangeText={(text) => { picked.current = null; onChangeText(text); setFocused(true); }} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 200)} placeholder="Search address" placeholderTextColor={page ? "#6D7990" : "#9AA6BF"} autoCorrect={false} style={[page ? pageForm.input : formUi.input, { paddingRight: page ? 46 : 36 }]} />
      {searching ? <ActivityIndicator size="small" color="#5C70FF" style={{ position: "absolute", right: page ? 16 : 10 }} /> : <Search size={page ? 20 : 16} color="#9AA6BF" style={{ position: "absolute", right: page ? 16 : 10 }} />}
    </View>
    {focused && suggestions.length > 0 && <View style={formUi.suggestions}>{suggestions.map((item, index) => <Pressable key={item.placeId} onPress={() => void choose(item)} style={[formUi.suggestion, index > 0 && formUi.suggestionBorder]}><Text numberOfLines={1} style={formUi.suggestionMain}>{item.primary}</Text>{!!item.secondary && <Text numberOfLines={1} style={formUi.suggestionSub}>{item.secondary}</Text>}</Pressable>)}</View>}
    {!!notice && <Text style={formUi.notice}>{notice}</Text>}
  </View>;
}

const ACCOUNT_TYPES = ["Savings Account", "Chequing Account", "Credit Card", "Debit Card", "Joint Account", "Business Account"];
const CARD_ACCOUNT_TYPES = ["Credit Card", "Debit Card"];
const CARD_TYPES = ["Visa", "Master Card"];
const isCardAccount = (accountType: string) => CARD_ACCOUNT_TYPES.includes(accountType);

function EditBusinessForm({ token, businessId, onClose, onSaved }: { token: string; businessId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Omit<BusinessDetails, "id" | "slug" | "logoUpdatedAt"> | null>(null);
  const [savedLogo, setSavedLogo] = useState<string | null>(null);
  const [logo, setLogo] = useState<PickedPhoto | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const logoSource = usePhotoSource((photo) => { setLogo(photo); setRemoveLogo(false); }, "Business logo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const startedAt = Date.now();
    void getBusiness(token, businessId).then(async ({ business }) => {
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, 500 - (Date.now() - startedAt))));
      if (!active) return;
      setForm({ name: business.name, aliasName: business.aliasName, businessAddress: business.businessAddress, addressLine2: business.addressLine2, city: business.city, province: business.province, postalCode: business.postalCode });
      setSavedLogo(business.logoUpdatedAt ?? null);
    })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load the business."); });
    return () => { active = false; };
  }, [token, businessId]);
  const set = (patch: Partial<Omit<BusinessDetails, "id" | "slug" | "logoUpdatedAt">>) => setForm((current) => current ? { ...current, ...patch } : current);
  const ready = !!form?.name.trim() && !!form?.businessAddress.trim() && !saving;
  const save = async () => {
    if (!form || !ready) return;
    setSaving(true); setError("");
    try {
      await updateBusiness(token, businessId, form);
      // Logo is optional: upload a new one, or remove the saved one.
      if (logo) await uploadBusinessLogo(token, businessId, logo);
      else if (removeLogo && savedLogo) await deleteBusinessLogo(token, businessId);
      onSaved();
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update the business."); }
    finally { setSaving(false); }
  };
  const showSaved = !!savedLogo && !removeLogo && !logo;
  const input = { placeholderTextColor: "#B8C0CE" };
  return <FormScreen title="Edit business" onClose={onClose} overlay={logoSource.sheet} footer={<View style={pageForm.actions}>
    <Pressable onPress={onClose} style={pageForm.secondary}><Text style={pageForm.secondaryText}>Cancel</Text></Pressable>
    <Pressable onPress={() => void save()} disabled={!ready} style={[pageForm.primary, !ready && pageForm.disabled]}><Text style={pageForm.primaryText}>{saving ? "Updating…" : "Update"}</Text></Pressable>
  </View>}>
    {!form ? (error ? <Text style={pageForm.error}>{error}</Text> : <FormSkeleton fields={6} />) : <View style={pageForm.fields}>
      <FormField size="page" {...input} label="Business name" required placeholder="Business name" value={form.name} onChangeText={(name) => set({ name })} />
      <View style={pageForm.row}>
        <FormField size="page" {...input} label="Alias name" placeholder="Short name" value={form.aliasName} onChangeText={(aliasName) => set({ aliasName })} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <PhotoInputField label="Logo (optional)" placeholder="Upload" value={logo} onPress={logoSource.openSheet}
            onRemove={() => { if (logo) setLogo(null); else setRemoveLogo(true); }}
            savedThumb={showSaved ? <AuthImage token={token} url={businessLogoUrl(businessId)} cacheKey={`logo-${businessId}-${savedLogo}`} style={photoUi.thumb} /> : undefined}
            labelStyle={pageForm.label} fieldStyle={[pageForm.input, newBizUi.logoField]} />
        </View>
      </View>
      <AddressSearchField size="page" token={token} label="Business address" required value={form.businessAddress} onChangeText={(businessAddress) => set({ businessAddress })} onSelect={(address) => set({ businessAddress: address.street, addressLine2: address.line2, city: address.city, province: address.province, postalCode: address.postalCode })} />
      <View style={pageForm.row}>
        <FormField size="page" {...input} label="Address" placeholder="Unit or suite" value={form.addressLine2} onChangeText={(addressLine2) => set({ addressLine2 })} />
        <FormField size="page" {...input} label="City" placeholder="City" value={form.city} onChangeText={(city) => set({ city })} />
      </View>
      <View style={pageForm.row}>
        <FormField size="page" {...input} label="Province" placeholder="BC" value={form.province} autoCapitalize="characters" onChangeText={(province) => set({ province })} />
        <FormField size="page" {...input} label="Postal code" placeholder="A1A 1A1" value={form.postalCode} autoCapitalize="characters" onChangeText={(postalCode) => set({ postalCode })} />
      </View>
      {!!error && <Text style={pageForm.error}>{error}</Text>}
    </View>}
  </FormScreen>;
}

const compactMask = (masked: string) => masked.replace(/\s+/g, "");

/** Institution icon like the web panel: Visa / Mastercard logo for cards with a card type, otherwise a bank. */
// Initials colours so businesses are easy to tell apart.
const BUSINESS_TINTS = ["#5C70FF", "#0E9F8E", "#E27B35", "#8B5CF6", "#D14D72", "#2F80ED"];

function InstitutionIcon({ accountType, cardType }: { accountType: string; cardType?: string | null }) {
  const Icon = isCardAccount(accountType) && cardType === "Visa" ? VisaIcon : isCardAccount(accountType) && cardType === "Master Card" ? MastercardIcon : BankIcon;
  return <View style={bizUi.logoBox}><Icon width={36} height={24} /></View>;
}

function EditAccountForm({ token, businessId, account, onClose, onSaved }: { token: string; businessId: string; account: Workspace['bankAccounts'][number]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(account.name);
  const [accountType, setAccountType] = useState(ACCOUNT_TYPES.includes(account.accountType) ? account.accountType : "Chequing Account");
  const maskedValue = compactMask(account.maskedNumber);
  const [accountNumber, setAccountNumber] = useState(maskedValue);
  const [isPrimary, setIsPrimary] = useState(!!account.isPrimary);
  const [cardType, setCardType] = useState(account.cardType ?? "");
  const [opening, setOpening] = useState(true);
  useEffect(() => { const timer = setTimeout(() => setOpening(false), 500); return () => clearTimeout(timer); }, []);
  // Only send a number when the user typed a new one; the masked value keeps the saved number.
  const newAccountNumber = accountNumber === maskedValue ? "" : accountNumber;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isCard = isCardAccount(accountType);
  const ready = !!name.trim() && (!isCard || !!cardType) && !saving;
  const save = async () => {
    if (!ready) return;
    setSaving(true); setError("");
    try { await updateBankAccount(token, businessId, account.id, { name: name.trim(), accountType, accountNumber: newAccountNumber || undefined, isPrimary, cardType: isCard ? cardType : null }); onSaved(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update the account."); }
    finally { setSaving(false); }
  };
  return <FormScreen title="Edit institution" onClose={onClose} footer={<View style={pageForm.actions}>
    <Pressable onPress={onClose} style={pageForm.secondary}><Text style={pageForm.secondaryText}>Cancel</Text></Pressable>
    <Pressable onPress={() => void save()} disabled={!ready} style={[pageForm.primary, !ready && pageForm.disabled]}><Text style={pageForm.primaryText}>{saving ? "Updating…" : "Update"}</Text></Pressable>
  </View>}>
    {opening ? <FormSkeleton fields={5} /> : <>
    {/* Same layout as Add institution. */}
    <View style={instUi.card}>
      <FormField size="page" placeholderTextColor="#B8C0CE" label="Institution name" required placeholder="e.g. CIBC" autoCapitalize="words" value={name} onChangeText={(value) => { setName(value); setError(""); }} />

      <Text style={instUi.sectionLabel}>Account type</Text>
      <View style={instUi.typeGrid}>
        {ACCOUNT_TYPES.map((type) => {
          const selected = accountType === type;
          const Icon = ACCOUNT_TYPE_ICONS[type] ?? Landmark;
          return <Pressable key={type} onPress={() => { setAccountType(type); if (!isCardAccount(type)) setCardType(""); setError(""); }} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={type}
            style={({ pressed }) => [instUi.typeCard, selected && instUi.typeCardOn, pressed && { opacity: 0.85 }]}>
            <View style={[instUi.typeIcon, selected && instUi.typeIconOn]}><Icon size={20} color={selected ? "#FFF" : "#5B6882"} strokeWidth={2.2} /></View>
            <Text numberOfLines={1} style={[instUi.typeLabel, selected && instUi.typeLabelOn]}>{type.replace(" Account", "")}</Text>
            {selected && <View style={instUi.typeCheck}><Check size={11} color="#FFF" strokeWidth={3.5} /></View>}
          </Pressable>;
        })}
      </View>

      {isCard && <>
        <Text style={instUi.sectionLabel}>Card type <Text style={{ color: "#E13B48" }}>*</Text></Text>
        <View style={instUi.cardRow}>
          {CARD_TYPES.map((type) => {
            const selected = cardType === type;
            const Logo = type === "Visa" ? VisaIcon : MastercardIcon;
            return <Pressable key={type} onPress={() => { setCardType(type); setError(""); }} style={({ pressed }) => [instUi.cardTile, selected && instUi.cardTileOn, pressed && { opacity: 0.85 }]} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={type}>
              <View style={[instUi.cardLogo, selected && instUi.cardLogoOn]}><Logo width={58} height={38} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={[instUi.cardName, selected && instUi.tileTextOn]}>{type}</Text>
                <Text numberOfLines={1} style={instUi.cardHint}>{type === "Visa" ? "Visa card" : "Mastercard"}</Text>
              </View>
              <View style={[instUi.radio, selected && instUi.radioOn]}>{selected && <Check size={13} color="#FFF" strokeWidth={3.5} />}</View>
            </Pressable>;
          })}
        </View>
      </>}

      <View style={{ marginTop: 20 }}>
        <FormField size="page" placeholderTextColor="#B8C0CE" label={`${accountType} number`} required placeholder={isCard ? "16-digit card number" : "Account number"} keyboardType="number-pad" maxLength={isCard ? 16 : 17} value={accountNumber} onFocus={() => { if (accountNumber === maskedValue) setAccountNumber(""); }} onBlur={() => { if (!accountNumber) setAccountNumber(maskedValue); }} onChangeText={(value) => setAccountNumber(value.replace(/\D/g, ""))} />
      </View>

      <Pressable onPress={() => setIsPrimary((value) => !value)} style={instUi.primaryRow} accessibilityRole="switch" accessibilityState={{ checked: isPrimary }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={instUi.primaryTitle}>Primary account</Text>
          <Text style={instUi.primarySub}>Used by default for this business.</Text>
        </View>
        <View style={[instUi.track, isPrimary && instUi.trackOn]}><View style={[instUi.thumb, isPrimary && instUi.thumbOn]} /></View>
      </Pressable>
    </View>
    {!!error && <Text style={pageForm.error}>{error}</Text>}
    </>}
  </FormScreen>;
}

// Edit pages use the same sizes as the Upload Bill page.
const pageForm = StyleSheet.create({
  screen: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "#F4F6FA" },
  body: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24 },
  fields: { gap: 18 },
  row: { flexDirection: "row", gap: 12 },
  label: { fontSize: 15, fontWeight: "700", color: "#17223A", marginBottom: 8 },
  input: { height: 56, borderRadius: 16, borderWidth: 1, borderColor: "#E3E7EF", backgroundColor: "#FFF", paddingHorizontal: 16, fontSize: 16, color: "#17223A", fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { height: 44, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: "#E3E7EF", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  chipOn: { borderColor: "#5C70FF", backgroundColor: "#EEF0FF" },
  chipText: { fontSize: 15, fontWeight: "700", color: "#5B6882" },
  chipTextOn: { color: "#4B5BE0" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: "#B8C1D3", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  checkboxOn: { backgroundColor: "#5C70FF", borderColor: "#5C70FF" },
  checkMark: { color: "#FFF", fontSize: 15, fontWeight: "800", marginTop: -1 },
  checkLabel: { fontSize: 16, fontWeight: "700", color: "#17223A" },
  error: { fontSize: 14, fontWeight: "700", textAlign: "center", color: "#D9363E" },
  footer: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 18, borderTopWidth: 1, borderTopColor: "#E6EAF2", backgroundColor: "#F4F6FA" },
  actions: { flexDirection: "row", gap: 12 },
  primary: { flex: 1, height: 56, borderRadius: 16, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center" },
  primaryText: { fontSize: 17, fontWeight: "800", color: "#FFF" },
  secondary: { flex: 1, height: 56, borderRadius: 16, borderWidth: 1, borderColor: "#E3E7EF", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 17, fontWeight: "700", color: "#17223A" },
  disabled: { backgroundColor: "#A7B1FA" },
});

const formUi = StyleSheet.create({
  screen: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "#F4F6FA", paddingHorizontal: 16, paddingTop: 18 },
  body: { paddingBottom: 24, gap: 10 },
  footer: { paddingTop: 10, paddingBottom: 16, borderTopWidth: 1, borderTopColor: "#E6EAF2", backgroundColor: "#F4F6FA" },
  section: { color: "#17223A", fontSize: 14, fontWeight: "800", marginTop: 6 },
  card: { borderRadius: 16, borderWidth: 1, borderColor: "#E2E6EF", backgroundColor: "#FFF", padding: 12, gap: 10 },
  row: { flexDirection: "row", gap: 8 },
  label: { color: "#4B5A78", fontSize: 12, fontWeight: "700", marginBottom: 5 },
  input: { height: 44, borderRadius: 11, borderWidth: 1, borderColor: "#E0E5EF", paddingHorizontal: 11, fontSize: 14, color: "#17223A", backgroundColor: "#FFF" },
  suggestions: { borderWidth: 1, borderColor: "#E1E6F0", borderRadius: 11, backgroundColor: "#FFF", marginTop: 4, overflow: "hidden" },
  suggestion: { paddingHorizontal: 11, paddingVertical: 8 },
  suggestionBorder: { borderTopWidth: 1, borderTopColor: "#EDF0F5" },
  suggestionMain: { color: "#17223A", fontWeight: "700", fontSize: 13 },
  suggestionSub: { color: "#71809A", fontSize: 11, marginTop: 1 },
  notice: { color: "#B7791F", fontSize: 11, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: "#F1F3F8", maxWidth: "100%" },
  chipOn: { backgroundColor: "#EAF0FF" },
  chipText: { color: "#66748F", fontSize: 12, fontWeight: "700" },
  chipTextOn: { color: "#2463EB" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: "#B8C1D3", alignItems: "center", justifyContent: "center" },
  checkboxOn: { backgroundColor: "#5C70FF", borderColor: "#5C70FF" },
  checkMark: { color: "#FFF", fontSize: 13, fontWeight: "800", marginTop: -1 },
  checkLabel: { color: "#17223A", fontSize: 14, fontWeight: "600" },
  dropzone: { minHeight: 120, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#C9D0DC", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", padding: 12, gap: 4 },
  preview: { width: 200, height: 80, borderRadius: 8, backgroundColor: "#F1F3F7" },
  dropTitle: { color: "#2463EB", fontSize: 14, fontWeight: "700", maxWidth: "100%" },
  dropSub: { color: "#71809A", fontSize: 12 },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  primary: { flex: 1, height: 46, borderRadius: 12, backgroundColor: "#2463EB", alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
  secondary: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: "#D5DBE6", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  secondaryText: { color: "#17223A", fontSize: 15, fontWeight: "700" },
  disabled: { backgroundColor: "#A7B6F5" },
  danger: { backgroundColor: "#E13B48" },
  message: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  success: { color: "#159148" },
  error: { color: "#D9363E", fontSize: 13, fontWeight: "600" },
  confirmTitle: { color: "#101A32", fontSize: 18, fontWeight: "800", marginTop: 4 },
  confirmText: { color: "#66748F", fontSize: 14, marginTop: 6, lineHeight: 20 },
});

const bizUi = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  back: { height: 40, width: 40, borderRadius: 12, borderWidth: 1, borderColor: "#E0E5EF", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 26, color: "#253049", marginTop: -3 },
  title: { flex: 1, color: "#101A32", fontSize: 22, fontWeight: "800" },
  add: { height: 38, borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center" },
  addText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  error: { color: "#D9363E", textAlign: "center", marginBottom: 10 },
  card: { borderRadius: 24, borderWidth: 1, borderColor: "#E4E8F1", backgroundColor: "#FFF", padding: 16, marginBottom: 18, shadowColor: "#1B2A4E", shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  cardActive: { borderColor: "#9FAEFF", borderWidth: 1.5 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  headMain: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 14 },
  iconButton: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, borderColor: "#CFDDFB", backgroundColor: "#F5F8FF", alignItems: "center", justifyContent: "center", marginLeft: 6 },
  iconDanger: { borderColor: "#F8C9CD", backgroundColor: "#FFF5F6" },
  initials: { height: 52, width: 52, borderRadius: 16, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center" },
  initialsText: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  name: { color: "#101A32", fontSize: 18, lineHeight: 23, fontWeight: "800" },
  meta: { color: "#71809A", fontSize: 14, marginTop: 3 },
  activeBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#EAF6EF" },
  activeText: { color: "#159148", fontSize: 12, fontWeight: "700" },
  switchBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#EEF0FF" },
  switchText: { color: "#5C70FF", fontSize: 12, fontWeight: "800" },
  accountRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  accountIcon: { height: 34, width: 34, borderRadius: 10, backgroundColor: "#121B34", alignItems: "center", justifyContent: "center" },
  accountName: { color: "#101A32", fontSize: 16, fontWeight: "800" },
  accountNumber: { color: "#6B778F", fontSize: 14, flexShrink: 1 },
  accountMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  typeBadge: { backgroundColor: "#E8F0FE", borderRadius: 7, paddingHorizontal: 9, paddingVertical: 3, flexShrink: 0 },
  typeBadgeText: { color: "#2F5FD0", fontSize: 13, fontWeight: "600" },
  logoBox: { width: 44, height: 32, alignItems: "center", justifyContent: "center" },
  balance: { color: "#101A32", fontSize: 14, fontWeight: "800" },
  addInstitution: { marginTop: 12, height: 46, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#B9C3FF", backgroundColor: "#F7F8FF", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  addInstitutionText: { color: "#4B5BE0", fontSize: 15, fontWeight: "800" },
  overlayPage: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "#F4F6FA" },
  noAccounts: { color: "#8A96AC", fontSize: 14, textAlign: "center", paddingVertical: 18 },
  headActions: { flexDirection: "row", gap: 8 },
  ghostButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EFF2FF", alignItems: "center", justifyContent: "center" },
  ghostSmall: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EFF2FF", alignItems: "center", justifyContent: "center" },
  ghostDanger: { backgroundColor: "#FFF0F1" },
  accountsBox: { marginTop: 16, borderRadius: 18, backgroundColor: "#F7F9FC", borderWidth: 1, borderColor: "#EDF0F6", paddingHorizontal: 12 },
  accountDivider: { borderTopWidth: 1, borderTopColor: "#E6EAF2" },
  logoTile: { width: 48, height: 40, borderRadius: 10, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E9EDF4", alignItems: "center", justifyContent: "center" },
  rowActions: { flexDirection: "row", gap: 6 },
});

const ACCOUNT_TYPE_ICONS: Record<string, typeof Landmark> = {
  "Savings Account": PiggyBank,
  "Chequing Account": Landmark,
  "Credit Card": CreditCard,
  "Debit Card": WalletCards,
  "Joint Account": Users,
  "Business Account": BriefcaseBusiness,
};

function AddInstitution({ token, business, onBack, onSaved, footerOffset = 0 }: { token: string; business: AuthSession['businesses'][number] | null; onBack: () => void; onSaved: () => Promise<void>; hideBusiness?: boolean; footerOffset?: number }) {
  const [name, setName] = useState("");
  const keyboardScroll = useKeyboardScroll(useRef<ScrollView>(null));
  const [accountType, setAccountType] = useState("Chequing Account");
  const [accountNumber, setAccountNumber] = useState("");
  const [cardType, setCardType] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const isCard = isCardAccount(accountType);
  const complete = !!business && !!name.trim() && (isCard ? accountNumber.length === 16 && !!cardType : accountNumber.length >= 5);
  const chooseType = (type: string) => { setAccountType(type); if (!isCardAccount(type)) setCardType(""); setAccountNumber((value) => value.slice(0, isCardAccount(type) ? 16 : 17)); setMessage(""); };
  const save = async () => {
    if (saving) return;
    Keyboard.dismiss();
    if (!business) { setMessage("Select a business first."); return; }
    if (!name.trim()) { setMessage("Enter the institution name."); return; }
    if (isCard && !cardType) { setMessage("Select the card type (Visa or Master Card)."); return; }
    if (isCard && accountNumber.length !== 16) { setMessage("Credit and debit card numbers must be 16 digits."); return; }
    if (!isCard && accountNumber.length < 5) { setMessage(`Enter the ${accountType.toLowerCase()} number (at least 5 digits).`); return; }
    setSaving(true); setMessage("");
    try {
      await createBankAccount(token, business.id, { name: name.trim(), accountNumber: accountNumber.trim(), accountType, isPrimary, cardType: isCard ? cardType : null });
      await onSaved();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to add the institution."); }
    finally { setSaving(false); }
  };
  return <View style={instUi.screen}>
    <View style={[bizUi.header, instUi.headerPad]}>
      <BackButton onPress={onBack} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[bizUi.title, instUi.titleFix]}>Add institution</Text>
        <Text numberOfLines={1} style={instUi.subtitle}>{business ? `to ${business.name}` : "No business selected"}</Text>
      </View>
    </View>
    <ScrollView {...keyboardScroll.scrollProps} style={{ flex: 1 }} contentContainerStyle={instUi.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

    <View style={instUi.card}>
      <FormField size="page" placeholderTextColor="#B8C0CE" label="Institution name" required placeholder="e.g. CIBC" autoCapitalize="words" value={name} onChangeText={(value) => { setName(value); setMessage(""); }} />

      <Text style={instUi.sectionLabel}>Account type</Text>
      {/* Account type as a 2-column grid of icon cards. */}
      <View style={instUi.typeGrid}>
        {ACCOUNT_TYPES.map((type) => {
          const selected = accountType === type;
          const Icon = ACCOUNT_TYPE_ICONS[type] ?? Landmark;
          return <Pressable key={type} onPress={() => chooseType(type)} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={type}
            style={({ pressed }) => [instUi.typeCard, selected && instUi.typeCardOn, pressed && { opacity: 0.85 }]}>
            <View style={[instUi.typeIcon, selected && instUi.typeIconOn]}><Icon size={20} color={selected ? "#FFF" : "#5B6882"} strokeWidth={2.2} /></View>
            <Text numberOfLines={1} style={[instUi.typeLabel, selected && instUi.typeLabelOn]}>{type.replace(" Account", "")}</Text>
            {selected && <View style={instUi.typeCheck}><Check size={11} color="#FFF" strokeWidth={3.5} /></View>}
          </Pressable>;
        })}
      </View>

      {isCard && <>
        <Text style={instUi.sectionLabel}>Card type <Text style={{ color: "#E13B48" }}>*</Text></Text>
        <View style={instUi.cardRow}>
          {CARD_TYPES.map((type) => {
            const selected = cardType === type;
            const Logo = type === "Visa" ? VisaIcon : MastercardIcon;
            return <Pressable key={type} onPress={() => { setCardType(type); setMessage(""); }} style={({ pressed }) => [instUi.cardTile, selected && instUi.cardTileOn, pressed && { opacity: 0.85 }]} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={type}>
              <View style={[instUi.cardLogo, selected && instUi.cardLogoOn]}><Logo width={58} height={38} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={[instUi.cardName, selected && instUi.tileTextOn]}>{type}</Text>
                <Text numberOfLines={1} style={instUi.cardHint}>{type === "Visa" ? "Visa card" : "Mastercard"}</Text>
              </View>
              <View style={[instUi.radio, selected && instUi.radioOn]}>{selected && <Check size={13} color="#FFF" strokeWidth={3.5} />}</View>
            </Pressable>;
          })}
        </View>
      </>}

      <View style={{ marginTop: 20 }}>
        <FormField size="page" placeholderTextColor="#B8C0CE" label={`${accountType} number`} required placeholder={isCard ? "16-digit card number" : "Account number"} keyboardType="number-pad" maxLength={isCard ? 16 : 17} value={accountNumber} onChangeText={(value) => { setAccountNumber(value.replace(/\D/g, "")); setMessage(""); }} />
      </View>

      <Pressable onPress={() => setIsPrimary((value) => !value)} style={instUi.primaryRow} accessibilityRole="switch" accessibilityState={{ checked: isPrimary }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={instUi.primaryTitle}>Primary account</Text>
          <Text style={instUi.primarySub}>Used by default for this business.</Text>
        </View>
        <View style={[instUi.track, isPrimary && instUi.trackOn]}><View style={[instUi.thumb, isPrimary && instUi.thumbOn]} /></View>
      </Pressable>
    </View>

      <View style={{ height: keyboardScroll.keyboardSpace }} />
    </ScrollView>
    <View style={[instUi.footer, { marginBottom: footerOffset }]}>
      {!!message && <Text style={[pageForm.error, { marginBottom: 10 }]}>{message}</Text>}
      <View style={instUi.footerRow}>
        <Pressable onPress={onBack} disabled={saving} style={pageForm.secondary}><Text style={pageForm.secondaryText}>Cancel</Text></Pressable>
        <Pressable onPress={() => void save()} disabled={saving} style={[pageForm.primary, !complete && instUi.saveIncomplete]} accessibilityRole="button" accessibilityLabel="Save institution">
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={pageForm.primaryText}>Save</Text>}
        </Pressable>
      </View>
    </View>
  </View>;
}

const instUi = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F6FA" },
  headerPad: { paddingHorizontal: 18, paddingTop: 18, marginBottom: 14 },
  body: { paddingHorizontal: 18, paddingBottom: 24 },
  footer: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 18, borderTopWidth: 1, borderTopColor: "#E6EAF2", backgroundColor: "#F4F6FA" },
  footerRow: { flexDirection: "row", gap: 12 },
  saveIncomplete: { opacity: 0.6 },
  titleFix: { flex: 0 },
  subtitle: { color: "#71809A", fontSize: 15, marginTop: 2 },
  preview: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "#DCE5FB", backgroundColor: "#F8FAFF", marginBottom: 16 },
  previewName: { color: "#101A32", fontSize: 17, fontWeight: "800" },
  primaryPill: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, backgroundColor: "#FFF4D6" },
  primaryPillText: { color: "#A86A00", fontSize: 12, fontWeight: "800" },
  card: { borderRadius: 22, borderWidth: 1, borderColor: "#E4E8F1", backgroundColor: "#FFF", padding: 18 },
  sectionLabel: { color: "#17223A", fontSize: 15, fontWeight: "700", marginTop: 20, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { width: "31.8%", height: 64, borderRadius: 12, borderWidth: 1.5, borderColor: "#E6EAF2", backgroundColor: "#F8F9FC", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 4 },
  tileOn: { borderColor: "#2463EB", backgroundColor: "#EEF3FF" },
  tileText: { color: "#5B6882", fontSize: 15, fontWeight: "700" },
  tileTextOn: { color: "#2463EB" },
  tick: { position: "absolute", top: 5, right: 5, width: 16, height: 16, borderRadius: 8, backgroundColor: "#2463EB", alignItems: "center", justifyContent: "center" },
  cardRow: { gap: 10 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  typeCard: { width: "48.5%", flexDirection: "row", alignItems: "center", gap: 10, minHeight: 58, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1.5, borderColor: "#E6EAF2", backgroundColor: "#FFF" },
  typeCardOn: { borderColor: "#2463EB", backgroundColor: "#F3F7FF" },
  typeIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: "#F1F3F8", alignItems: "center", justifyContent: "center" },
  typeIconOn: { backgroundColor: "#2463EB" },
  typeLabel: { flex: 1, color: "#3E4A63", fontSize: 15, fontWeight: "700" },
  typeLabelOn: { color: "#1D4ED8" },
  typeCheck: { position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: "#2463EB", alignItems: "center", justifyContent: "center" },
  cardTile: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 72, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, borderWidth: 1.5, borderColor: "#E6EAF2", backgroundColor: "#FFF" },
  cardTileOn: { borderColor: "#2463EB", backgroundColor: "#F3F7FF" },
  cardLogo: { width: 72, height: 48, borderRadius: 10, borderWidth: 1, borderColor: "#E6EAF2", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  cardLogoOn: { borderColor: "#BFD2FB" },
  cardName: { color: "#17223A", fontSize: 16, fontWeight: "800" },
  cardHint: { color: "#8A96AC", fontSize: 13, marginTop: 2 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#C7D0E1", alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: "#2463EB", backgroundColor: "#2463EB" },
  hint: { color: "#8A96AC", fontSize: 13, marginTop: 6 },
  primaryRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 20, paddingTop: 18, borderTopWidth: 1, borderTopColor: "#EEF1F6" },
  primaryTitle: { color: "#17223A", fontSize: 16, fontWeight: "700" },
  primarySub: { color: "#8A96AC", fontSize: 13, marginTop: 3 },
  track: { width: 52, height: 30, borderRadius: 15, backgroundColor: "#D5DBE6", padding: 3, justifyContent: "center" },
  trackOn: { backgroundColor: "#2463EB" },
  thumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#FFF" },
  thumbOn: { alignSelf: "flex-end" },
});

const pageUi = StyleSheet.create({
  screen: { padding: 16, paddingTop: 18, paddingBottom: 126, backgroundColor: "#F4F6FA", flexGrow: 1 }, header: { height: 62, flexDirection: "row", alignItems: "center", marginBottom: 16 }, back: { height: 48, width: 48, borderRadius: 15, borderWidth: 1, borderColor: "#E0E5EF", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" }, backText: { fontSize: 30, color: "#253049", marginTop: -4 }, title: { color: "#101A32", fontSize: 27, fontWeight: "800", marginLeft: 16 }, profileCard: { minHeight: 126, padding: 22, borderRadius: 25, borderWidth: 1, borderColor: "#E2E6EF", backgroundColor: "#FFF", flexDirection: "row", alignItems: "center", marginBottom: 20 }, profileIcon: { height: 78, width: 78, borderRadius: 25, backgroundColor: "#EEF0FF", alignItems: "center", justifyContent: "center", marginRight: 20 }, profileName: { color: "#101A32", fontSize: 18, fontWeight: "800" }, profileEmail: { color: "#71809A", fontSize: 15, marginTop: 4 }, staff: { color: "#5C70FF", backgroundColor: "#EEF0FF", borderRadius: 15, paddingHorizontal: 13, paddingVertical: 6, fontSize: 14, fontWeight: "700" }, formCard: { borderRadius: 25, borderWidth: 1, borderColor: "#E2E6EF", backgroundColor: "#FFF", padding: 22 }, formLabel: { color: "#101A32", fontSize: 15, fontWeight: "600", marginBottom: 10 }, formFieldSpaced: { marginTop: 20 }, formInput: { height: 64, borderRadius: 18, borderWidth: 1, borderColor: "#E0E5EF", paddingHorizontal: 18, fontSize: 17, color: "#17223A" }, formInputDisabled: { backgroundColor: "#F7F8FC", color: "#71809A" }, save: { height: 76, borderRadius: 21, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center", marginTop: 22 }, saveText: { color: "#FFF", fontSize: 20, fontWeight: "800" }, add: { height: 54, borderRadius: 17, paddingHorizontal: 16, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center" }, addText: { color: "#FFF", fontSize: 16, fontWeight: "800" }, businessCard: { borderRadius: 25, borderWidth: 1, borderColor: "#E2E6EF", backgroundColor: "#FFF", padding: 24 }, businessHead: { flexDirection: "row", alignItems: "center" }, initials: { height: 68, width: 68, borderRadius: 20, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center", marginRight: 16 }, initialsText: { color: "#FFF", fontSize: 22, fontWeight: "800" }, active: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#EAF6EF" }, activeText: { color: "#159148", fontSize: 13, fontWeight: "700" }, cardDivider: { height: 1, backgroundColor: "#E9EDF3", marginVertical: 20 }, accountRow: { minHeight: 96, borderRadius: 20, borderWidth: 1, borderColor: "#E1E6EF", padding: 14, flexDirection: "row", alignItems: "center", marginTop: 12 }, accountIcon: { height: 60, width: 60, borderRadius: 17, backgroundColor: "#121B34", alignItems: "center", justifyContent: "center", marginRight: 16 }, accountName: { color: "#101A32", fontSize: 16, fontWeight: "800" }, accountNumber: { color: "#8A96AC", fontSize: 14, marginTop: 4 }, accountBalance: { color: "#101A32", fontSize: 16, fontWeight: "800" }, balanceLabel: { color: "#8A96AC", fontSize: 13, marginTop: 4 },
});
function Team({ onBack, onAdd, token, businesses }: { token: string; businesses: Array<{ id: string; name: string; slug: string }>; onBack: () => void; onAdd: () => void }) {
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  // Opening a user shows placeholder rows before the business switches appear.
  const [opening, showOpening] = useBriefLoading(600);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadError, setLoadError] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  useMessageHaptic(loadError, true);
  const refreshControl = usePullRefresh(() => getUsers(token).then((result) => { setUsers(result.users); setLoadError(''); }).catch((error) => setLoadError(error instanceof Error ? error.message : 'Unable to load users.')));
  useEffect(() => { setLoadingUsers(true); const startedAt = Date.now(); void getUsers(token).then(async (result) => { await new Promise((resolve) => setTimeout(resolve, Math.max(0, 800 - (Date.now() - startedAt)))); setUsers(result.users); }).catch((error) => setLoadError(error instanceof Error ? error.message : 'Unable to load users.')).finally(() => setLoadingUsers(false)); }, [token]);
  const activeUsers = users.filter((user) => user.isActive);
  const toggleBusiness = async (user: ManagedUser, businessId: string) => {
    const businessIds = user.businesses.some((business) => business.id === businessId)
      ? user.businesses.filter((business) => business.id !== businessId).map((business) => business.id)
      : [...user.businesses.map((business) => business.id), businessId];
    setSavingUserId(user.id);
    try {
      const result = await updateUserBusinesses(token, user.id, businessIds);
      setUsers((items) => items.map((item) => item.id === user.id ? { ...item, businesses: result.businesses } : item));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to update business access.');
    } finally {
      setSavingUserId(null);
    }
  };
  const deactivateUser = async (user: ManagedUser) => {
    setSavingUserId(user.id);
    try {
      await updateUser(token, user.id, { isActive: false });
      setUsers((items) => items.filter((item) => item.id !== user.id));
      setOpenUserId(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to remove user.');
    } finally {
      setSavingUserId(null);
    }
  };
  return (
    <ScrollView refreshControl={refreshControl} contentContainerStyle={team.screen} showsVerticalScrollIndicator={false}>
      <View style={bizUi.header}>
        <BackButton onPress={onBack} />
        <Text style={bizUi.title}>Users</Text>
        <Pressable onPress={onAdd} style={bizUi.add} accessibilityRole="button"><Text style={bizUi.addText}>＋ Add</Text></Pressable>
      </View>
      {!!loadError && <Text style={{ color: '#D9363E', textAlign: 'center', marginBottom: 12 }}>{loadError}</Text>}
      {loadingUsers && <CardListSkeleton count={4} />}
      {!loadingUsers && !loadError && !activeUsers.length && <Text style={{ color: '#71809A', textAlign: 'center', marginTop: 16 }}>No users have been added yet.</Text>}
      {!loadingUsers && activeUsers.length > 0 && <Text style={team.summary}>{activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'}</Text>}
      {activeUsers.map((user) => {
        const isOpen = openUserId === user.id;
        const initials = user.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();
        const isAdmin = user.role === 'admin';
        const shown = user.businesses.slice(0, 2);
        const more = user.businesses.length - shown.length;
        return (
        <View key={user.id} style={[team.card, isOpen && team.openCard]}>
          <Pressable onPress={() => { if (!isOpen) showOpening(); setOpenUserId(isOpen ? null : user.id); }} style={team.cardRow} accessibilityRole="button" accessibilityState={{ expanded: isOpen }} accessibilityLabel={`${user.name}, ${user.role}`}>
            {user.avatarUpdatedAt
              ? <AuthImage token={token} url={userAvatarUrl(user.id)} cacheKey={`avatar-${user.id}-${user.avatarUpdatedAt}`} style={[team.initials, { borderRadius: 24 }]} />
              : <DefaultAvatar size={48} radius={24} />}
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={team.nameRow}>
                <Text numberOfLines={1} style={[team.name, { flexShrink: 1 }]}>{user.name}</Text>
                <View style={[team.roleBadge, isAdmin && team.roleBadgeAdmin]}><Text style={[team.roleText, isAdmin && team.roleTextAdmin]}>{user.role[0].toUpperCase() + user.role.slice(1)}</Text></View>
              </View>
              <Text numberOfLines={1} style={team.email}>{user.email}</Text>
            </View>
            <View style={[team.chevron, isOpen && team.chevronOpen]}>{isOpen ? <ChevronUp size={18} color="#4B5BE0" /> : <ChevronDown size={18} color="#7E8CA7" />}</View>
          </Pressable>
          <View style={team.accessChips}>
            {shown.map((business) => <View key={business.id} style={team.accessChip}><Building2 size={13} color="#5B6882" /><Text numberOfLines={1} style={team.accessChipText}>{business.name}</Text></View>)}
            {more > 0 && <View style={[team.accessChip, team.accessMore]}><Text style={team.accessMoreText}>+{more} more</Text></View>}
            {!user.businesses.length && <Text style={team.noAccess}>No business access</Text>}
          </View>
          {isOpen && (
            <View style={team.expand}>
              <View style={team.expandHead}>
                <Text style={team.expandTitle}>Business access</Text>
                <Text style={team.expandCount}>{user.businesses.length} of {businesses.length}</Text>
              </View>
              {opening && <SheetRowsSkeleton count={Math.min(Math.max(businesses.length, 2), 5)} />}
              {!opening && businesses.map((business) => {
                const hasAccess = user.businesses.some((item) => item.id === business.id);
                return (
                <Pressable disabled={savingUserId === user.id} onPress={() => void toggleBusiness(user, business.id)} style={[team.toggleRow, hasAccess && team.toggleRowOn]} key={business.id} accessibilityRole="switch" accessibilityState={{ checked: hasAccess }}>
                  <Text numberOfLines={1} style={team.toggleLabel}>{business.name}</Text>
                  <View style={[team.toggle, hasAccess && team.toggleOn]}>
                    <View style={team.knob} />
                  </View>
                </Pressable>
                );
              })}
              {!opening && !businesses.length && <Text style={team.emptyAccess}>No businesses are available.</Text>}
              {!user.isSeedAdmin && <Pressable disabled={savingUserId === user.id} onPress={() => void deactivateUser(user)} style={[team.remove, savingUserId === user.id && { opacity: 0.55 }]}>
                <Trash size={16} color="#E13B48" /><Text style={team.removeText}>{savingUserId === user.id ? 'Saving…' : 'Remove user'}</Text>
              </Pressable>}
            </View>
          )}
        </View>
        );
      })}
    </ScrollView>
  );
}
function AddUser({ token, businesses, onBack, onSaved }: { token: string; businesses: Array<{ id: string; name: string; slug: string }>; onBack: () => void; onSaved: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>(businesses.map((business) => business.id));
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const photoSource = usePhotoSource(setPhoto, "Profile photo");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; success: boolean } | null>(null);
  // Placeholder fields for a moment when the page opens, like the other forms.
  const [opening] = useBriefLoading(800, true);
  useAutoClear(!!toast?.success, toast, () => setToast(null));
  const saveUser = async () => {
    if (!email.trim()) {
      setToast({ text: "Enter an email address to add a user.", success: false });
      return;
    }
    if (!isEmailAddress(normalizeEmailInput(email))) {
      setToast({ text: "Enter a valid email address, like name@company.com.", success: false });
      return;
    }
    setSaving(true);
    try {
      const created = await createUser(token, { name: name.trim() || normalizeEmailInput(email).split('@')[0], email: normalizeEmailInput(email), role: 'staff', businessIds: selectedBusinessIds });
      // The photo is optional; the user is added even if its upload fails.
      const photoFailed = photo ? await uploadUserAvatar(token, created.user.id, photo).then(() => false).catch(() => true) : false;
      setToast({ text: photoFailed ? `${email.trim()} was added, but the photo could not be uploaded.` : `${email.trim()} was added successfully.`, success: !photoFailed });
      setEmail("");
      setName("");
      setPhoto(null);
    } catch (error) {
      setToast({ text: error instanceof Error ? error.message : "Unable to add user. Please try again.", success: false });
    } finally { setSaving(false); }
  };
  return (
    // Raised above the tab bar while the camera/gallery sheet is open.
    <View style={[{ flex: 1 }, photoSource.open && { zIndex: 20, elevation: 20 }]}>
    <ScrollView contentContainerStyle={team.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={bizUi.header}>
        <BackButton onPress={onBack} />
        <Text style={bizUi.title}>Add user</Text>
      </View>
      {opening ? <><FormSkeleton fields={3} style={team.form} /><CardListSkeleton count={Math.min(Math.max(businesses.length, 1), 3)} /></> : <>
      <View style={team.form}>
        <Text style={team.formLabel}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Optional"
          placeholderTextColor="#9AA6BF"
          style={team.input}
        />
        <Text style={[team.formLabel, team.formSpaced]}>
          Email <Text style={{ color: "#F02E35" }}>*</Text>
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="name@company.com"
          placeholderTextColor="#9AA6BF"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={team.input}
        />
        <View style={team.formSpaced}><PhotoInputField round label="Profile photo (optional)" placeholder="Take a photo or upload one" value={photo} onPress={photoSource.openSheet} onRemove={() => setPhoto(null)} labelStyle={team.formLabel} fieldStyle={team.input} /></View>
      </View>
      <View style={team.form}>
        <Text style={team.sectionTitle}>Business access</Text>
        {businesses.map((business) => (
            <Pressable onPress={() => setSelectedBusinessIds((current) => current.includes(business.id) ? current.filter((id) => id !== business.id) : [...current, business.id])} style={team.toggleRow} key={business.id}>
              <Text style={team.toggleLabel}>{business.name}</Text>
              <View style={[team.toggle, selectedBusinessIds.includes(business.id) && team.toggleOn]}>
                <View style={team.knob} />
              </View>
            </Pressable>
        ))}
      </View>
      <Pressable onPress={saveUser} disabled={saving || !email.trim()} style={[team.submit, (saving || !email.trim()) && team.submitDisabled]} accessibilityRole="button">
        <Text style={team.submitText}>{saving ? "Adding…" : "Add user"}</Text>
      </Pressable>
      {!!toast && <View style={[team.toast, toast.success ? team.toastSuccess : team.toastError]}><Text style={[team.toastText, toast.success ? team.toastSuccessText : team.toastErrorText]}>{toast.text}</Text></View>}
      <Text style={team.bottomHelp}>
        They sign in with this email and see only the businesses selected above.
      </Text>
      </>}
    </ScrollView>
    {photoSource.sheet}
    </View>
  );
}
const team = StyleSheet.create({
  screen: { padding: 16, paddingTop: 18, paddingBottom: 125, backgroundColor: "#F4F6FA" },
  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  back: {
    height: 48,
    width: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E0E5EF",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 30, color: "#253049", marginTop: -4 },
  title: { fontSize: 27, fontWeight: "700", color: "#15203D", marginLeft: 15 },
  add: {
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#B6C0FF",
    backgroundColor: "#F4F5FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  addText: { fontSize: 18, fontWeight: "700", color: "#5C70FF" },
  card: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E4E8F1", borderRadius: 22, padding: 16, marginBottom: 14, shadowColor: "#1B2A4E", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  openCard: { borderColor: "#B9C3FF" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  initials: { height: 48, width: 48, borderRadius: 15, backgroundColor: "#EEF0FF", alignItems: "center", justifyContent: "center" },
  initialText: { fontSize: 17, fontWeight: "800", color: "#5C70FF" },
  name: { fontSize: 17, fontWeight: "800", color: "#17223A" },
  role: { fontSize: 11, fontWeight: "700", color: "#6D7990", backgroundColor: "#EEF0F5", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: "hidden" },
  email: { fontSize: 14, color: "#65728B", marginTop: 3 },
  access: { fontSize: 12, color: "#97A3BA", marginTop: 2 },
  chev: { fontSize: 22, color: "#93A0B9", paddingLeft: 8 },
  expand: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: "#E9EDF3" },
  toggleRow: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: "#E6EAF2", backgroundColor: "#FAFBFD", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  toggleLabel: { fontSize: 15, color: "#202A40", fontWeight: "600", flex: 1, marginRight: 10 },
  toggle: { height: 26, width: 46, borderRadius: 14, backgroundColor: "#D5DAE8", padding: 3, justifyContent: "center" },
  toggleOn: { backgroundColor: "#5C70FF", alignItems: "flex-end" },
  knob: { height: 20, width: 20, borderRadius: 10, backgroundColor: "#FFF" },
  emptyAccess: { color: "#71809A", fontSize: 14, marginTop: 14, textAlign: "center" },
  remove: { height: 46, borderRadius: 14, backgroundColor: "#FFF0F1", flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", marginTop: 14 },
  removeText: { fontSize: 15, fontWeight: "700", color: "#E13B48" },
  toast: { marginTop: 10, minHeight: 40, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, justifyContent: "center" },
  toastSuccess: { backgroundColor: "#EAF6EF" },
  toastError: { backgroundColor: "#FFF0F1" },
  toastText: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  toastSuccessText: { color: "#159148" },
  toastErrorText: { color: "#D9363E" },
  form: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E6EF", borderRadius: 16, padding: 14, marginBottom: 12 },
  formLabel: { fontSize: 13, fontWeight: "700", color: "#17223A", marginBottom: 6 },
  formSpaced: { marginTop: 12 },
  input: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: "#E0E5EF", paddingHorizontal: 12, fontSize: 15, color: "#17223A" },
  roles: { height: 42, borderRadius: 12, backgroundColor: "#E8EBF4", padding: 4, flexDirection: "row" },
  roleChoice: { flex: 1, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  roleChoiceOn: {
    backgroundColor: "#FFF",
    shadowColor: "#99A2B8",
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 1,
  },
  roleChoiceText: { fontSize: 14, color: "#61708B", fontWeight: "700" },
  roleChoiceTextOn: { color: "#17223A" },
  help: { fontSize: 12, color: "#91A0B8", marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#17223A" },
  submit: { height: 48, borderRadius: 14, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center" },
  submitDisabled: { backgroundColor: "#A8B1FA" },
  submitText: { fontSize: 16, fontWeight: "800", color: "#FFF" },
  bottomHelp: { fontSize: 12, color: "#94A1B9", textAlign: "center", lineHeight: 17, marginTop: 12, paddingHorizontal: 16 },
  summary: { color: "#71809A", fontSize: 14, fontWeight: "600", marginBottom: 12, marginLeft: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  initialsAdmin: { backgroundColor: "#5C70FF" },
  initialTextAdmin: { color: "#FFF" },
  roleBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "#EEF0F5" },
  roleBadgeAdmin: { backgroundColor: "#EAEDFF" },
  roleText: { fontSize: 12, fontWeight: "700", color: "#5B6882" },
  roleTextAdmin: { color: "#4B5BE0" },
  chevron: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F3F5FA", alignItems: "center", justifyContent: "center" },
  chevronOpen: { backgroundColor: "#EAEDFF" },
  accessChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12, marginLeft: 60 },
  accessChip: { flexDirection: "row", alignItems: "center", gap: 5, maxWidth: "100%", borderRadius: 9, backgroundColor: "#F3F5FA", paddingHorizontal: 9, paddingVertical: 5 },
  accessChipText: { fontSize: 12, fontWeight: "600", color: "#4A566E", flexShrink: 1 },
  accessMore: { backgroundColor: "#EAEDFF" },
  accessMoreText: { fontSize: 12, fontWeight: "700", color: "#4B5BE0" },
  noAccess: { fontSize: 13, color: "#97A3BA" },
  expandHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  expandTitle: { fontSize: 14, fontWeight: "800", color: "#17223A" },
  expandCount: { fontSize: 13, fontWeight: "600", color: "#71809A" },
  toggleRowOn: { borderColor: "#C9D0FF", backgroundColor: "#F6F7FF" },
});
function More({
  onLogout,
  onBusinesses,
  onTeam,
  onCharts,
  onReports,
  onProfile,
  onShortcuts,
  isAdmin,
}: {
  isAdmin: boolean;
  onLogout: () => void;
  onBusinesses: () => void;
  onTeam: () => void;
  onCharts: () => void;
  onReports: () => void;
  onProfile: () => void;
  onShortcuts: () => void;
}) {
  // Users is for admins only (the server allows only admins to manage users).
  const rows = [
    ["Charts", onCharts, BarChart3],
    ["Businesses", onBusinesses, Building2],
    ...(isAdmin ? [["Users", onTeam, UsersRound] as const] : []),
    ["Profile", onProfile, UserRound],
    ["Gestures", onShortcuts, Vibrate],
    ["Sign out", onLogout, LogOut],
  ] as const;
  return (
    <ScrollView contentContainerStyle={s.moreScreen}>
      <View style={s.moreHeader}><Text style={s.pageTitle}>More</Text><Text style={s.pageSubtitle}>Manage your business and account</Text></View>
      <View style={s.moreList}>
        {rows.map(([title, onPress, Icon]) => {
          const danger = title === "Sign out";
          return (
            <Pressable key={title} onPress={onPress} style={s.moreRow}>
              <View style={[s.moreIconBox, danger && s.nativeIconDanger]}>
                <Icon
                  size={21}
                  color={danger ? "#F02E35" : "#5C70FF"}
                  strokeWidth={2.2}
                />
              </View>
              <Text style={[s.moreText, danger && { color: "#F02E35" }]}>
                {title}
              </Text>
              <ChevronRight
                size={20}
                color="#9AA6BD"
                style={{ marginLeft: "auto" }}
              />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

/** Same layout as More: the heading stays, each menu row is a gray placeholder. */
function MoreSkeleton({ rows }: { rows: number }) {
  return (
    <ScrollView contentContainerStyle={s.moreScreen} scrollEnabled={false}>
      <View style={s.moreHeader}><Text style={s.pageTitle}>More</Text><Text style={s.pageSubtitle}>Manage your business and account</Text></View>
      <Skeleton style={s.moreList}>
        {Array.from({ length: rows }, (_, index) => (
          <View key={index} style={s.moreRow}>
            <Bone width={44} height={44} radius={14} />
            <Bone width={index % 2 ? 90 : 120} height={15} style={{ marginLeft: 14 }} />
          </View>
        ))}
      </Skeleton>
    </ScrollView>
  );
}

function NavIcon({ page, active }: { page: string; active: boolean }) {
  const color = active ? "#5B6CFF" : "#9AA5BB";
  const props = { size: 26, color, strokeWidth: active ? 2.7 : 2 };
  if (page === "home") return <HomeIcon {...props} />;
  if (page === "transactions") return <List {...props} />;
  if (page === "receipts") return <ReceiptText {...props} />;
  if (page === "upload") return <CloudUpload {...props} />;
  return <MoreHorizontal {...props} />;
}
function Nav({
  page,
  setPage,
}: {
  page: string;
  setPage: (x: string) => void;
}) {
  const list = [
    ["home", "Home"],
    ["upload", "Upload"],
    ["transactions", "Transactions"],
    ["more", "More"],
  ];
  // Keeps the labels clear of the iPhone home bar.
  const { bottom } = useIosInsets();
  return (
    <View style={[s.nav, bottom > 0 && { paddingBottom: Math.max(22, bottom) }]}>
      {list.map(([id, label]) => {
        const active = page === id;
        return (
          <Pressable
            style={({ pressed }) => [s.navItem, pressed && s.navItemPressed]}
            key={id}
            onPress={() => setPage(id)}
            accessibilityState={{ selected: active }}
          >
            <View style={[s.navGlyph, active && s.navGlyphActive]}>
              <NavIcon page={id} active={active} />
            </View>
            <Text style={[s.navText, active && s.navActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
function BusinessSheet({
  businesses,
  selectedBusinessId,
  onClose,
  onChoose,
  onAdd,
}: {
  businesses: Array<{ id: string; name: string; slug: string; logoUpdatedAt?: string | null }>;
  selectedBusinessId: string | null;
  onClose: () => void;
  onChoose: (businessId: string) => void;
  onAdd: () => void;
}) {
  const b = [...businesses.map((business) => ({ id: business.id, name: business.name, subtitle: `${business.name} · BC`, logoUpdatedAt: business.logoUpdatedAt })), { id: 'new', name: '+ Add business', subtitle: 'Create another business', logoUpdatedAt: null }];
  return (
    <View style={s.overlay}>
      <Pressable style={s.overlayTap} onPress={onClose} />
      <SlideUpSheet onClose={onClose} style={s.homeBusiness} scrollable>
        <View style={s.homeBusinessHandle} />
        <View style={s.homeBusinessHead}>
          <Text style={s.homeBusinessTitle}>Select business</Text>
          <Pressable style={s.homeBusinessClose} onPress={onClose}>
            <Text style={s.closeText}>×</Text>
          </Pressable>
        </View>
        {b.map((business) => (
          <Pressable
            onPress={business.id === 'new' ? onAdd : () => onChoose(business.id)}
            style={[s.homeBusinessRow, business.id === selectedBusinessId && s.businessSelected]}
            key={business.id}
          >
            <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12 }}>
              {business.id !== 'new' && <BusinessLogo business={business} size={40} radius={12} fallback={<BusinessIconTile size={40} radius={12} />} />}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={s.homeBusinessName}>{business.name}</Text>
                <Text numberOfLines={1} style={s.homeBusinessSub}>{business.subtitle}</Text>
              </View>
            </View>
            {business.id === selectedBusinessId && <Text style={s.check}>✓</Text>}
          </Pressable>
        ))}
      </SlideUpSheet>
    </View>
  );
}

/** "Chequing Account" → "Chequing", "Credit Card" → "Credit". */
function shortAccountType(type: string) {
  return type.replace(/ Account$/, '').replace(/ Card$/, '');
}

/** Bank account line used in every bank picker, like the OATRx dropdown. */
function BankOptionContent({ account }: { account: { name: string; maskedNumber: string; accountType: string; cardType?: string | null } }) {
  return <View style={bankRowUi.wrap}>
    <Text numberOfLines={1} style={bankRowUi.name}>{account.name}</Text>
    <View style={bankRowUi.meta}>
      <InstitutionIcon accountType={account.accountType} cardType={account.cardType} />
      <Text numberOfLines={1} style={bankRowUi.number}>{compactMask(account.maskedNumber)}</Text>
      <Text numberOfLines={1} style={bankRowUi.type}>({shortAccountType(account.accountType)})</Text>
    </View>
  </View>;
}

const bankRowUi = StyleSheet.create({
  wrap: { flex: 1, minWidth: 0, paddingRight: 12 },
  name: { color: "#101A32", fontSize: 17, fontWeight: "800", textTransform: "none" },
  meta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  number: { color: "#6B778F", fontSize: 14 },
  type: { color: "#6B778F", fontSize: 14, flexShrink: 1 },
});

function BankSheet({ accounts, selectedBankId, onChoose, onAdd, onClose, onMakePrimary }: { accounts: Workspace['bankAccounts']; selectedBankId: string | null; onChoose: (bankId: string) => void; onAdd: () => void; onClose: () => void; onMakePrimary: (account: Workspace['bankAccounts'][number], primary: boolean) => Promise<void> }) {
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  // Primary account first, then the rest in their saved order.
  const ordered = [...accounts].sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary));
  const makePrimary = async (account: Workspace['bankAccounts'][number]) => {
    setSavingId(account.id); setError("");
    try { await onMakePrimary(account, !account.isPrimary); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to change the primary account."); }
    finally { setSavingId(""); }
  };
  useMessageHaptic(error, true);
  return (
    <View style={s.overlay}>
      <Pressable style={s.overlayTap} onPress={onClose} />
      <SlideUpSheet onClose={onClose} style={s.business} scrollable>
        <View style={s.handle} />
        <View style={s.businessHead}>
          <View style={{ flex: 1 }}>
            <Text style={s.businessTitle}>Select bank account</Text>
            <Text style={bankPickUi.subtitle}>Tap to view · use the switch to set the primary account</Text>
          </View>
          <Pressable style={s.close} onPress={onClose}>
            <Text style={s.closeText}>×</Text>
          </Pressable>
        </View>
        {!!error && <Text style={bankPickUi.error}>{error}</Text>}
        {ordered.map((account) => {
          const selected = account.id === selectedBankId;
          return (
            <View key={account.id} style={[bankPickUi.row, selected && bankPickUi.rowOn]}>
              <Pressable onPress={() => onChoose(account.id)} style={({ pressed }) => [bankPickUi.main, pressed && { opacity: 0.7 }]} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={account.name}>
                <View style={[bankPickUi.iconTile, selected && bankPickUi.iconTileOn]}><InstitutionIcon accountType={account.accountType} cardType={account.cardType} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={bankPickUi.nameLine}>
                    <Text numberOfLines={1} style={bankPickUi.name}>{account.name}</Text>
                    {selected && <View style={bankPickUi.check}><Check size={10} color="#FFF" strokeWidth={3.5} /></View>}
                  </View>
                  <Text numberOfLines={1} style={bankPickUi.meta}>{compactMask(account.maskedNumber)} · {shortAccountType(account.accountType)}</Text>
                </View>
              </Pressable>
              <Pressable onPress={() => void makePrimary(account)} disabled={!!savingId} hitSlop={10} style={bankPickUi.switchBox} accessibilityRole="switch" accessibilityState={{ checked: !!account.isPrimary, busy: savingId === account.id }} accessibilityLabel={`Primary account: ${account.name}`}>
                {savingId === account.id ? <ActivityIndicator size="small" color="#5C70FF" /> : <View style={[bankPickUi.track, account.isPrimary && bankPickUi.trackOn]}><View style={[bankPickUi.thumb, account.isPrimary && bankPickUi.thumbOn]} /></View>}
                <Text style={[bankPickUi.switchLabel, account.isPrimary && bankPickUi.switchLabelOn]}>Primary</Text>
              </Pressable>
            </View>
          );
        })}
        <Pressable onPress={onAdd} style={({ pressed }) => [bankPickUi.add, pressed && { opacity: 0.7 }]} accessibilityRole="button"><Plus size={18} color="#4B5BE0" strokeWidth={2.6} /><Text style={bankPickUi.addText}>Add institution</Text></Pressable>
      </SlideUpSheet>
    </View>
  );
}

const bankPickUi = StyleSheet.create({
  subtitle: { color: "#8A96AD", fontSize: 12, marginTop: 2 },
  error: { color: "#D9363E", fontSize: 13, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: "#E4E8F1", backgroundColor: "#FFF", marginBottom: 8, paddingRight: 12 },
  rowOn: { borderColor: "#5C70FF", backgroundColor: "#F7F8FF" },
  main: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingLeft: 12 },
  iconTile: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#F1F3F8", alignItems: "center", justifyContent: "center" },
  iconTileOn: { backgroundColor: "#E6E9FF" },
  nameLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { flexShrink: 1, color: "#101A32", fontSize: 15, fontWeight: "800" },
  check: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center" },
  meta: { color: "#6B778F", fontSize: 12, marginTop: 2 },
  badge: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 3, marginTop: 4, borderRadius: 6, backgroundColor: "#FFF4D6", paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: "#A86A00", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  switchBox: { alignItems: "center", gap: 3, paddingLeft: 8, minWidth: 48 },
  track: { width: 40, height: 22, borderRadius: 11, backgroundColor: "#D5DBE6", padding: 2, justifyContent: "center" },
  trackOn: { backgroundColor: "#F5B400" },
  thumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#FFF" },
  thumbOn: { alignSelf: "flex-end" },
  switchLabel: { color: "#9AA6BD", fontSize: 10, fontWeight: "700" },
  switchLabelOn: { color: "#A86A00" },
  add: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 46, marginTop: 4, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#C9D0FF", backgroundColor: "#F5F6FF" },
  addText: { color: "#4B5BE0", fontSize: 14, fontWeight: "800" },
});


function PeriodSheet({ selected, onChoose, onClose }: { selected: 'This month' | 'Last month' | 'This quarter' | 'Year to date'; onChoose: (period: 'This month' | 'Last month' | 'This quarter' | 'Year to date') => void; onClose: () => void }) {
  const periods = [
    ["This month", "Aug 1 – Sep 2, 2026"],
    ["Last month", "Jul 1 – Jul 31, 2026"],
    ["This quarter", "Jul 1 – Sep 2, 2026"],
    ["Year to date", "Jan 1 – Sep 2, 2026"],
  ];
  return (
    <View style={s.overlay}>
      <Pressable style={s.overlayTap} onPress={onClose} />
      <SlideUpSheet onClose={onClose} style={[s.business, s.periodSheet]}>
        <View style={s.handle} />
        <View style={s.businessHead}>
          <Text style={s.businessTitle}>Date range</Text>
          <Pressable style={s.close} onPress={onClose}>
            <Text style={s.closeText}>×</Text>
          </Pressable>
        </View>
        <ScrollView
          style={s.periodOptions}
          contentContainerStyle={s.periodOptionsContent}
          showsVerticalScrollIndicator={false}
        >
          {periods.map((period) => (
            <Pressable
              onPress={() => onChoose(period[0] as 'This month' | 'Last month' | 'This quarter' | 'Year to date')}
              key={period[0]}
              style={[s.businessRow, period[0] === selected && s.businessSelected]}
            >
              <View>
                <Text style={s.businessName}>{period[0]}</Text>
                <Text style={s.businessSub}>{period[1]}</Text>
              </View>
              {period[0] === selected && <Text style={s.check}>✓</Text>}
            </Pressable>
          ))}
        </ScrollView>
      </SlideUpSheet>
    </View>
  );
}

function Flow({
  name,
  close,
  done,
}: {
  name: string;
  close: () => void;
  done: () => void;
}) {
  const copy: any =
    {
      csv: [
        "Import transactions",
        "Choose a CSV file from your bank, then review it before importing.",
        "bank-statement-september.csv",
        "Import 10 transactions",
      ],
      details: [
        "Transaction details",
        "Meridian Supply Canada · Sep 2, 2026",
        "Inventory · GST $199.17",
        "Save changes",
      ],
      upload: [
        "Attach receipt",
        "Northline Wholesale Supply · -$318.44",
        "Choose a receipt photo",
        "Attach receipt",
      ],
      addBusiness: [
        "Add a business",
        "Set up a business before tracking its spending and receipts.",
        "Westside Retail Ltd.",
        "Save business",
      ],
      team: [
        "Team access",
        "As an Admin, you can manage who sees each business.",
        "Simran Kaur · Admin · All businesses\nDaniel Chen · Staff · Westside Retail\nPriya Nair · Staff · 2 businesses\nKavita Rao · Accountant · Westside Retail",
        "Invite user",
      ],
      invite: [
        "Add user",
        "They sign in with this email and see only the businesses you choose.",
        "Email address\nRole: Staff or Accountant\nBusiness access: Westside Retail",
        "Send invite",
      ],
    }[name] || [];
  return (
    <View style={s.overlay}>
      <Pressable style={s.overlayTap} onPress={close} />
      <SlideUpSheet style={s.business} scrollable>
        <View style={s.handle} />
        <View style={s.businessHead}>
          <Text style={s.businessTitle}>{copy[0]}</Text>
          <Pressable style={s.close} onPress={close}>
            <Text style={s.closeText}>×</Text>
          </Pressable>
        </View>
        <Text
          style={{
            fontSize: 16,
            color: "#66748F",
            lineHeight: 24,
            marginBottom: 22,
          }}
        >
          {copy[1]}
        </Text>
        <View
          style={{
            backgroundColor: "#F2F4FF",
            borderRadius: 20,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <Text style={s.businessName}>{copy[2]}</Text>
          <Text style={s.businessSub}>
            {name === "csv"
              ? "10 transactions ready to review"
              : name === "team"
                ? "Only Administrators can change team access"
                : "Complete the information and continue"}
          </Text>
        </View>
        <Pressable style={[s.upload, { marginTop: 12 }]} onPress={done}>
          <Text style={s.white}>{copy[3]}</Text>
        </Pressable>
        <Pressable
          onPress={close}
          style={{ alignItems: "center", padding: 18 }}
        >
          <Text style={{ color: "#66748F", fontWeight: "700" }}>Cancel</Text>
        </Pressable>
      </SlideUpSheet>
    </View>
  );
}

// React Native 0.86 exposes absoluteFill at runtime; this generated style is otherwise valid.
// @ts-ignore
const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: "#F3F5FB", paddingTop: 52 },
  content: { padding: 22, paddingBottom: 118 },
  moreScreen: { padding: 16, paddingTop: 18, paddingBottom: 118 },
  moreHeader: { marginBottom: 14 },
  pageTitle: { fontSize: 25, lineHeight: 30, fontWeight: "800", color: "#17223A" },
  pageSubtitle: { fontSize: 14, color: "#8290A8", marginTop: 3 },
  auth: { flex: 1, backgroundColor: "#10182D" },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "#596CF8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },
  logoText: {
    fontSize: 50,
    fontWeight: "900",
    color: "#FFF",
    borderWidth: 3,
    borderColor: "#FFF",
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  authTitle: { color: "#FFF", fontSize: 33, fontWeight: "800" },
  brandTagline: { color: "#B8C0D8", fontSize: 12, fontWeight: "700", letterSpacing: 3, marginTop: 9, textAlign: "center" },
  authSub: {
    color: "#B7C0D8",
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    marginTop: 16,
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 24,
  },
  welcome: { fontSize: 31, fontWeight: "800", color: "#101A32" },
  desc: { fontSize: 16, color: "#66748F", marginTop: 9, marginBottom: 28 },
  googleBtn: {
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8E0EE",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  google: {
    color: "#4285F4",
    fontSize: 26,
    fontWeight: "900",
    marginRight: 17,
  },
  googleIconWrap: { marginRight: 13 },
  googleBtnText: { fontSize: 17, fontWeight: "800", color: "#101A32" },
  secure: { color: "#93A0B9", textAlign: "center", marginTop: 27 },
  handle: {
    alignSelf: "center",
    width: 60,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#E1E5EF",
    marginBottom: 14,
  },
  selectRow: { flexDirection: "row", gap: 12, marginBottom: 22 },
  selector: { flex: 1 },
  selectorLabel: {
    fontSize: 12,
    color: "#99A5BD",
    fontWeight: "800",
    marginBottom: 8,
  },
  selectorBox: {
    height: 60,
    backgroundColor: "#FFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E1E5EF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorValue: { fontSize: 15, color: "#101A32", fontWeight: "700" },
  arrow: { fontSize: 18, color: "#93A0B8" },
  spend: {
    height: 192,
    borderRadius: 34,
    backgroundColor: "#131E3B",
    padding: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  cardLabel: { fontSize: 13, color: "#AAB7CE", fontWeight: "800" },
  spendNum: { fontSize: 39, fontWeight: "800", color: "#FFF", marginTop: 31 },
  period: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#546185",
    paddingHorizontal: 15,
    paddingTop: 11,
    color: "#FFF",
    fontWeight: "800",
  },
  stats: { flexDirection: "row", gap: 12, marginBottom: 20 },
  stat: {
    flex: 1,
    height: 120,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E1E5EF",
    backgroundColor: "#FFF",
    padding: 19,
  },
  statTitle: { color: "#64728E", fontSize: 15 },
  statIcon: {
    position: "absolute",
    right: 19,
    top: 18,
    color: "#5B6CFF",
    fontSize: 21,
  },
  statNum: { fontSize: 31, color: "#101A32", fontWeight: "800", marginTop: 17 },
  actions: { flexDirection: "row", gap: 12, marginBottom: 33 },
  upload: {
    flex: 1,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#5B6CFF",
    justifyContent: "center",
    alignItems: "center",
  },
  export: {
    flex: 1,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E1E5EF",
    justifyContent: "center",
    alignItems: "center",
  },
  white: { color: "#FFF", fontSize: 17, fontWeight: "800" },
  dark: { color: "#101A32", fontSize: 17, fontWeight: "800" },
  head: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  headTitle: { fontSize: 21, fontWeight: "800", color: "#101A32" },
  hint: { fontSize: 14, color: "#97A3BB", marginLeft: 9 },
  see: {
    color: "#5B6CFF",
    fontWeight: "700",
    marginLeft: 12,
    backgroundColor: "#EBEEFF",
    padding: 9,
    borderRadius: 18,
  },
  list: {
    borderRadius: 23,
    overflow: "hidden",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E1E5EF",
  },
  search: {
    height: 69,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E1E5EF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 19,
    marginBottom: 21,
  },
  searchI: { fontSize: 28, color: "#9AA6BF", marginRight: 12 },
  searchText: { fontSize: 19, color: "#9AA6BF" },
  tx: {
    minHeight: 92,
    borderWidth: 1,
    borderRadius: 24,
    backgroundColor: "#FFF",
    marginBottom: 15,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 19,
  },
  txCompact: {
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: "#E8EBF2",
    marginBottom: 0,
  },
  txOpen: { height: 355, alignItems: "flex-start", paddingTop: 23 },
  accent: { width: 6, alignSelf: "stretch" },
  txIcon: {
    height: 56,
    width: 56,
    borderRadius: 18,
    marginLeft: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  txInfo: { flex: 1, marginLeft: 23 },
  merchant: { color: "#111A31", fontSize: 18, fontWeight: "800" },
  meta: { color: "#68758E", fontSize: 16, marginTop: 3 },
  amount: { fontSize: 19, fontWeight: "800", color: "#111A31" },
  chev: { fontSize: 19, color: "#9AA6BD", marginLeft: 14 },
  details: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 91,
    bottom: 0,
    backgroundColor: "#F0F2FF",
    padding: 22,
  },
  detailLine: {
    height: 1,
    backgroundColor: "#DCE1FA",
    marginHorizontal: -22,
    marginTop: -22,
    marginBottom: 19,
  },
  detailFields: { flexDirection: "row", gap: 8 },
  field: { flex: 1 },
  fieldLab: {
    color: "#929DB5",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  fieldVal: {
    height: 57,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E1E5EF",
    borderRadius: 15,
    padding: 16,
    color: "#111A31",
    fontSize: 15,
  },
  memo: {
    height: 57,
    backgroundColor: "#FFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E1E5EF",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
  },
  memoText: { flex: 1, color: "#111A31", fontSize: 14 },
  bill: {
    padding: 17,
    color: "#5B6CFF",
    fontWeight: "800",
    borderLeftWidth: 1,
    borderColor: "#AAB5FF",
  },
  viewDetails: {
    color: "#5B6CFF",
    fontWeight: "800",
    textAlign: "right",
    marginTop: 13,
  },
  tabs: {
    height: 66,
    borderRadius: 19,
    backgroundColor: "#E6EAF5",
    padding: 5,
    flexDirection: "row",
    marginBottom: 21,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabOn: { backgroundColor: "#FFF", borderRadius: 15 },
  tabText: { color: "#64728E", fontWeight: "700", fontSize: 15 },
  tabTextOn: { color: "#101A32", fontWeight: "800" },
  receipt: {
    height: 103,
    borderRadius: 24,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E1E5EF",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  miss: {
    height: 66,
    width: 66,
    borderRadius: 20,
    backgroundColor: "#FDEBED",
    alignItems: "center",
    justifyContent: "center",
  },
  missText: { fontSize: 26, color: "#F02E35" },
  upBtn: { backgroundColor: "#5B6CFF", borderRadius: 16, padding: 14 },
  chart: {
    backgroundColor: "#FFF",
    borderRadius: 29,
    borderWidth: 1,
    borderColor: "#E1E5EF",
    padding: 26,
    marginBottom: 20,
  },
  chartCap: { fontSize: 16, color: "#64728E" },
  chartNum: { color: "#06142D", fontSize: 32, fontWeight: "800", marginTop: 7 },
  donut: {
    position: "absolute",
    right: 25,
    top: 25,
    height: 125,
    width: 125,
    borderRadius: 63,
    borderWidth: 21,
    borderColor: "#5B6CFF",
    borderTopColor: "#3372DB",
    borderLeftColor: "#74745C",
    justifyContent: "center",
    alignItems: "center",
  },
  stack: {
    height: 16,
    borderRadius: 10,
    overflow: "hidden",
    flexDirection: "row",
    marginTop: 78,
    marginBottom: 23,
  },
  part: { height: 16 },
  legend: { height: 30, flexDirection: "row", alignItems: "center" },
  dot: { height: 15, width: 15, borderRadius: 5, marginRight: 14 },
  legendName: { fontSize: 16, color: "#111A31", fontWeight: "700", flex: 1 },
  pct: { color: "#98A5BC", width: 42, textAlign: "right" },
  legendValue: {
    color: "#111A31",
    fontWeight: "700",
    width: 112,
    textAlign: "right",
  },
  month: {
    minHeight: 395,
    backgroundColor: "#FFF",
    borderRadius: 29,
    borderWidth: 1,
    borderColor: "#E1E5EF",
    padding: 26,
  },
  avg: { fontSize: 15, color: "#64728E", fontWeight: "400" },
  bars: {
    height: 245,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 23,
    borderBottomWidth: 1,
    borderColor: "#E1E5EF",
  },
  barCol: { width: "15%", alignItems: "center" },
  barVal: { fontSize: 12, fontWeight: "700" },
  bar: {
    width: 42,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    marginTop: 7,
  },
  barMonth: { marginTop: 10, fontWeight: "700" },
  reportTop: {
    backgroundColor: "#FFF",
    borderRadius: 29,
    borderWidth: 1,
    borderColor: "#E1E5EF",
    padding: 27,
    marginBottom: 22,
  },
  date: {
    height: 71,
    borderRadius: 19,
    backgroundColor: "#F6F7FA",
    borderWidth: 1,
    borderColor: "#E1E5EF",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: { fontSize: 17, fontWeight: "800", color: "#111A31" },
  reportStats: { flexDirection: "row", gap: 14, marginTop: 20 },
  smallStat: {
    flex: 1,
    backgroundColor: "#F6F7FA",
    borderRadius: 19,
    padding: 17,
  },
  smallVal: { fontSize: 27, fontWeight: "800", color: "#111A31" },
  reportAction: {
    height: 110,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E1E5EF",
    backgroundColor: "#FFF",
    padding: 25,
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 15,
  },
  reportIcon: {
    height: 58,
    width: 58,
    borderRadius: 19,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  reportText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111A31",
    marginLeft: 20,
  },
  reportArrow: { fontSize: 32, color: "#8E9BB3", marginLeft: "auto" },
  profile: {
    height: 104,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E1E5EF",
    backgroundColor: "#FFF",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  profileName: { fontSize: 17, fontWeight: "800", color: "#111A31" },
  moreList: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E1E5EF",
    backgroundColor: "#FFF",
  },
  moreRow: {
    height: 76,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: "#EDF0F4",
    flexDirection: "row",
    alignItems: "center",
  },
  moreIconBox: { height: 44, width: 44, borderRadius: 14, backgroundColor: "#EEF0FF", alignItems: "center", justifyContent: "center" },
  moreIcon: { fontSize: 26, color: "#5B6CFF", width: 55, textAlign: "center" },
  moreText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111A31",
    marginLeft: 10,
  },
  nav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 124,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#E1E5EF",
    flexDirection: "row",
    paddingTop: 12,
    paddingBottom: 22,
  },
  navItem: { flex: 1, alignItems: "center", paddingTop: 2, borderRadius: 16 },
  navItemPressed: { opacity: 0.72 },
  navIcon: { fontSize: 24, color: "#9AA5BB", fontWeight: "700" },
  navText: { fontSize: 12, color: "#53627C", marginTop: 4, fontWeight: "700" },
  navActive: { color: "#4358E8", fontWeight: "800" },
  overlay: {
    position: "absolute",
    // The app is drawn scaled, so the status bar height is converted to layout units.
    top: (NativeStatusBar.currentHeight ?? 0) / UI_SCALE,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(13,22,43,.42)",
    justifyContent: "flex-end",
  },
  overlayTap: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  business: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 22,
  },
  periodSheet: { maxHeight: 500, paddingBottom: 0 },
  periodOptions: { width: "100%", flexShrink: 1 },
  periodOptionsContent: { paddingBottom: 56 },
  homeBusiness: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 22,
  },
  homeBusinessHandle: { alignSelf: "center", width: 60, height: 5, borderRadius: 5, backgroundColor: "#E1E5EF", marginBottom: 14 },
  homeBusinessHead: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  homeBusinessTitle: { fontSize: 22, color: "#111A31", fontWeight: "800" },
  homeBusinessClose: { height: 42, width: 42, borderRadius: 14, borderWidth: 1, borderColor: "#E1E5EF", alignItems: "center", justifyContent: "center", marginLeft: "auto" },
  homeBusinessRow: { minHeight: 72, borderRadius: 18, borderWidth: 1, borderColor: "#E1E5EF", paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  homeBusinessName: { fontSize: 16, fontWeight: "800", color: "#111A31" },
  homeBusinessSub: { fontSize: 14, color: "#66748F", marginTop: 2 },
  businessHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  businessTitle: { fontSize: 22, color: "#111A31", fontWeight: "800" },
  close: {
    height: 42,
    width: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E1E5EF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  closeText: { fontSize: 26 },
  businessRow: {
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E1E5EF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  businessSelected: { borderColor: "#5B6CFF", backgroundColor: "#F7F8FF" },
  businessName: { fontSize: 16, fontWeight: "800", color: "#111A31" },
  businessSub: { fontSize: 14, color: "#66748F", marginTop: 2 },
  bankAccountInfo: { flex: 1, minWidth: 0, paddingRight: 12 },
  check: { color: "#5B6CFF", fontSize: 23, fontWeight: "800" },
  nativeIconBox: {
    height: 48,
    width: 48,
    borderRadius: 15,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  nativeIconDanger: { backgroundColor: "#FDEBED" },
  navGlyph: {
    height: 38,
    width: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  navGlyphActive: { backgroundColor: "#E8ECFF", borderWidth: 1, borderColor: "#DFE4FF" },
});
