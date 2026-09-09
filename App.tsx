import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Building2,
  Camera,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CloudUpload,
  Download,
  Eye,
  FileCheck,
  FileText,
  FileWarning,
  Folder,
  Home as HomeIcon,
  Image as ImageIcon,
  List,
  LogOut,
  Mail,
  MoreHorizontal,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Tag,
  Upload,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import { attachExistingBill, AuthSession, AvailableBill, billFileUrl, createBankAccount, createBusiness, createTransaction, createUser, downloadBillPreview, FinanceTransaction, getAvailableBills, getCurrentSession, getUsers, getWorkspace, importTransactionsCsv, ManagedUser, requestLoginCode, transactionBillFileUrl, updateProfile, updateTransaction, uploadBill, uploadStandaloneBill, verifyLoginCode, Workspace } from "./src/api";

// The HTML reference uses fixed CSS typography. Keep native screens visually
// consistent on Android devices that have a larger system font setting.
(Text as any).defaultProps = { ...((Text as any).defaultProps || {}), allowFontScaling: false, maxFontSizeMultiplier: 1 };
(TextInput as any).defaultProps = { ...((TextInput as any).defaultProps || {}), allowFontScaling: false, maxFontSizeMultiplier: 1 };

export default function App() {
  const [page, setPage] = useState("login");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [googleAccountSheet, setGoogleAccountSheet] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authBusinesses, setAuthBusinesses] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [currentUser, setCurrentUser] = useState<AuthSession['user'] | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceError, setWorkspaceError] = useState("");
  const [homeNotice, setHomeNotice] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [businesses, setBusinesses] = useState(false);
  const [bankSheet, setBankSheet] = useState(false);
  const [periodSheet, setPeriodSheet] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'This month' | 'Last month' | 'This quarter' | 'Year to date'>('This month');
  const [uploadSheet, setUploadSheet] = useState(false);
  const [csvSheet, setCsvSheet] = useState(false);
  const [pendingBillFile, setPendingBillFile] = useState<{ uri: string; name: string; mimeType?: string | null } | null>(null);
  const [flow, setFlow] = useState("");
  const loadWorkspace = async (token: string, businessId?: string) => {
    setWorkspaceError("");
    try {
      const data = await getWorkspace(token, businessId);
      setWorkspace(data);
      setSelectedBankId((current) => data.bankAccounts.some((account) => account.id === current) ? current : data.bankAccounts[0]?.id ?? null);
    }
    catch (error) { setWorkspaceError(error instanceof Error ? error.message : "Unable to load your business data."); }
  };
  useEffect(() => {
    void (async () => {
      const token = await SecureStore.getItemAsync("mediaccounts.session");
      if (!token) return;
      try {
        const session = await getCurrentSession(token);
        setSessionToken(token);
        setAuthBusinesses(session.businesses);
        setCurrentUser(session.user);
        await loadWorkspace(token);
        setPage(session.businesses.length ? "home" : "empty");
      } catch { await SecureStore.deleteItemAsync("mediaccounts.session"); }
    })();
  }, []);
  useEffect(() => {
    if (page === "login") Keyboard.dismiss();
  }, [page]);

  const sendCode = async () => {
    setAuthError("");
    if (!email.trim()) { setAuthError("Enter your email address."); return; }
    setAuthBusy(true);
    try { await requestLoginCode(email); Keyboard.dismiss(); setCode(""); setPage("code"); }
    catch (error) { setAuthError(error instanceof Error ? error.message : "Unable to send a code."); }
    finally { setAuthBusy(false); }
  };

  const confirmCode = async () => {
    setAuthError("");
    if (code.length !== 6) { setAuthError("Enter the 6-digit verification code."); return; }
    setAuthBusy(true);
    try {
      const session = await verifyLoginCode(email, code);
      await SecureStore.setItemAsync("mediaccounts.session", session.token);
      setSessionToken(session.token);
      setAuthBusinesses(session.businesses);
      setCurrentUser(session.user);
      await loadWorkspace(session.token);
      setPage(session.businesses.length ? "home" : "empty");
    } catch (error) { setAuthError(error instanceof Error ? error.message : "Unable to verify the code."); }
    finally { setAuthBusy(false); }
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("mediaccounts.session");
    setSessionToken(null);
    setAuthBusinesses([]);
    setCurrentUser(null);
    setWorkspace(null);
    setCode("");
    setAuthError("");
    setPage("login");
  };
  const saveStandaloneBill = async (file: { uri: string; name: string; mimeType?: string | null }) => {
    if (!sessionToken || !workspace?.activeBusiness) return;
    setUploadSheet(false); setHomeNotice('Uploading bill…');
    try { await uploadStandaloneBill(sessionToken, { businessId: workspace.activeBusiness.id, bankAccountId: selectedBankId, file }); await loadWorkspace(sessionToken, workspace.activeBusiness.id); setHomeNotice('Bill uploaded for this business. Attach it from a transaction when ready.'); }
    catch (error) { setHomeNotice(error instanceof Error ? error.message : 'Unable to upload the bill.'); }
  };
  const chooseBillMedia = async (source: 'camera' | 'gallery') => {
    const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setAuthError(`Allow ${source === 'camera' ? 'camera' : 'photo library'} access to upload a bill.`); return; }
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled) { const asset = result.assets[0]; await saveStandaloneBill({ uri: asset.uri, name: asset.fileName ?? `bill-${Date.now()}.jpg`, mimeType: asset.mimeType ?? 'image/jpeg' }); }
  };
  const chooseBillFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (!result.canceled) { const asset = result.assets[0]; await saveStandaloneBill({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType }); }
  };
  if (page === "details")
    return (
      <View style={s.app}>
        <TransactionDetails transaction={workspace?.transactions.find((item) => item.id === selectedTransactionId) ?? workspace?.transactions[0]} token={sessionToken ?? ""} onChanged={() => sessionToken && void loadWorkspace(sessionToken)} onBack={() => setPage("transactions")} />
        <Nav page="transactions" setPage={setPage} />
      </View>
    );
  if (page === "uploadBill")
    return (
      <View style={s.app}>
        <UploadBill token={sessionToken ?? ""} workspace={workspace} transactions={(workspace?.transactions ?? []).filter((item) => !selectedBankId || item.bankAccountId === selectedBankId)} selectedBankId={selectedBankId} preferredTransactionId={selectedTransactionId} initialFile={pendingBillFile} onChooseMedia={chooseBillMedia} onSaved={(matchedTransactionId) => { setPendingBillFile(null); setSelectedTransactionId(matchedTransactionId); if (sessionToken) void loadWorkspace(sessionToken, workspace?.activeBusiness?.id); setPage("details"); }} onBack={() => setPage(selectedTransactionId ? "details" : "home")} />
        <Nav page="home" setPage={setPage} />
      </View>
    );
  if (page === "team")
    return (
      <View style={s.app}>
        <Team token={sessionToken ?? ""} onBack={() => setPage("more")} onAdd={() => setPage("addUser")} />
        <Nav page="more" setPage={setPage} />
      </View>
    );
  if (page === "addUser")
    return (
      <View style={s.app}>
        <AddUser token={sessionToken ?? ""} businesses={authBusinesses} onBack={() => setPage("team")} onSaved={() => setPage("team")} />
        <Nav page="more" setPage={setPage} />
      </View>
    );
  if (page === "profile")
    return <View style={s.app}><ProfilePage token={sessionToken ?? ''} user={currentUser} onUpdated={(user) => setCurrentUser(user)} onBack={() => setPage("more")} /><Nav page="more" setPage={setPage} /></View>;
  if (page === "businesses")
    return <View style={s.app}><BusinessesPage workspace={workspace} onBack={() => setPage("more")} onAdd={() => setPage("newbiz")} /><Nav page="more" setPage={setPage} /></View>;
  if (page === "addInstitution")
    return <View style={s.app}><AddInstitution token={sessionToken ?? ''} business={workspace?.activeBusiness ?? null} onBack={() => setPage('home')} onSaved={async () => { if (sessionToken) await loadWorkspace(sessionToken, workspace?.activeBusiness?.id); setPage('home'); }} /><Nav page="home" setPage={setPage} /></View>;
  if (page === "code")
    return (
      <Otp email={email} code={code} onCodeChange={setCode} busy={authBusy} error={authError} onBack={() => { setAuthError(""); setPage("login"); }} onNext={confirmCode} onResend={sendCode} />
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
        onBack={() => setPage("empty")}
        token={sessionToken ?? ""}
        onCreate={async (business) => { setAuthBusinesses((items) => items.some((item) => item.id === business.id) ? items : [...items, business]); if (sessionToken) await loadWorkspace(sessionToken, business.id); setPage("home"); }}
      />
    );
  if (page === "newtransaction")
    return <NewTransaction token={sessionToken ?? ""} workspace={workspace} onBack={() => setPage("transactions")} onCreated={() => { if (sessionToken) void loadWorkspace(sessionToken, workspace?.activeBusiness?.id); setPage("transactions"); }} />;
  if (page === "login")
    return (
      <Auth
        account={googleAccountSheet}
        onGoogle={() => setGoogleAccountSheet(true)}
        onAccountSelected={() => { setGoogleAccountSheet(false); setAuthError("Use your approved email address to receive a sign-in code."); }}
        email={email}
        onEmailChange={setEmail}
        busy={authBusy}
        error={authError}
        onEmail={sendCode}
      />
    );
  return (
    <View style={s.app}>
      <StatusBar style="dark" />
      {page === "home" && (
        <Dashboard
          workspace={workspace}
          error={workspaceError}
          notice={homeNotice}
          selectedBankId={selectedBankId}
          selectedPeriod={selectedPeriod}
          onBusiness={() => setBusinesses(true)}
          onBank={() => setBankSheet(true)}
          onPeriod={() => setPeriodSheet(true)}
          onTransactions={() => setPage("transactions")}
          onDetails={(id) => { setSelectedTransactionId(id); setPage("details"); }}
          onUpload={() => setUploadSheet(true)}
          onImport={() => setCsvSheet(true)}
        />
      )}
      {page === "transactions" && (
        <AllTransactions transactions={(workspace?.transactions ?? []).filter((item) => !selectedBankId || item.bankAccountId === selectedBankId)} onAdd={() => setPage("newtransaction")} onDetails={(id) => { setSelectedTransactionId(id); setPage("details"); }} />
      )}
      {page === "receipts" && <Bills transactions={(workspace?.transactions ?? []).filter((item) => !selectedBankId || item.bankAccountId === selectedBankId)} />}
      {page === "charts" && <Charts workspace={workspace} selectedBankId={selectedBankId} selectedPeriod={selectedPeriod} onBack={() => setPage("more")} />}
      {page === "reports" && <Reports workspace={workspace} selectedBankId={selectedBankId} selectedPeriod={selectedPeriod} onBack={() => setPage("more")} />}
      {page === "more" && (
        <More
          onLogout={signOut}
          onBusinesses={() => setPage("businesses")}
          onTeam={() => setPage("team")}
          onCharts={() => setPage("charts")}
          onReports={() => setPage("reports")}
          onProfile={() => setPage("profile")}
        />
      )}
      <Nav page={page === "charts" || page === "reports" ? "more" : page} setPage={setPage} />
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
      {bankSheet && <BankSheet accounts={workspace?.bankAccounts ?? []} selectedBankId={selectedBankId} onChoose={(bankId) => { setSelectedBankId(bankId); setBankSheet(false); }} onAdd={() => { setBankSheet(false); setPage('addInstitution'); }} onClose={() => setBankSheet(false)} />}
      {periodSheet && <PeriodSheet selected={selectedPeriod} onChoose={(period) => { setSelectedPeriod(period); setPeriodSheet(false); }} onClose={() => setPeriodSheet(false)} />}
      {uploadSheet && <UploadOptionsSheet onClose={() => setUploadSheet(false)} onCamera={() => void chooseBillMedia('camera')} onGallery={() => void chooseBillMedia('gallery')} onFiles={() => void chooseBillFile()} />}
      {csvSheet && <CsvUploadSheet token={sessionToken ?? ''} workspace={workspace} selectedBankId={selectedBankId} onClose={() => setCsvSheet(false)} onImported={() => { setCsvSheet(false); if (sessionToken) void loadWorkspace(sessionToken, workspace?.activeBusiness?.id); }} />}
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
  return `${amount < 0 ? '-' : ''}$${Math.abs(amount).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

function GoogleIcon({ size = 28 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path fill="#4285F4" d="M21.35 12.23c0-.79-.07-1.55-.2-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.78h3.14c1.84-1.7 2.9-4.2 2.9-7.17 0-.76-.07-1.5-.2-2.2Z"/><Path fill="#34A853" d="M12 21.5c2.64 0 4.86-.88 6.48-2.4l-3.14-2.78c-.87.58-1.98.92-3.34.92-2.55 0-4.7-1.72-5.47-4.03H3.3V16.1A9.78 9.78 0 0 0 12 21.5Z"/><Path fill="#FBBC05" d="M6.53 13.21A5.88 5.88 0 0 1 6.22 12c0-.42.07-.82.2-1.21V7.9H3.3A9.5 9.5 0 0 0 2.5 12c0 1.57.38 3.05.8 4.1l3.23-2.89Z"/><Path fill="#EA4335" d="M12 6.76c1.48 0 2.8.51 3.84 1.5l2.88-2.81C16.86 3.72 14.64 2.5 12 2.5A9.78 9.78 0 0 0 3.3 7.9l3.23 2.89C7.3 8.48 9.45 6.76 12 6.76Z"/></Svg>;
}

function BrandWordmark() {
  return <Svg width={285} height={46} viewBox="0 0 285 46"><Defs><SvgLinearGradient id="brandWordmark" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#FFFFFF"/><Stop offset="1" stopColor="#8492FF"/></SvgLinearGradient></Defs><SvgText x="142.5" y="35" textAnchor="middle" fontSize="34" fontWeight="800" fill="url(#brandWordmark)">MediAccounts</SvgText></Svg>;
}

function BrandMark() {
  return <Svg width={48} height={48} viewBox="0 0 48 48" fill="none"><Path d="M12 34V14l11.2 13.4L35 14" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"/><Path d="M29.5 34 36 21.5" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round"/></Svg>;
}

function SlideUpSheet({ children, style }: { children: any; style: any }) {
  const translateY = useRef(new Animated.Value(460)).current;
  useEffect(() => {
    Animated.timing(translateY, { toValue: 0, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [translateY]);
  return <Animated.View style={[style, { transform: [{ translateY }] }]}>{children}</Animated.View>;
}

function UploadOptionsSheet({ onClose, onCamera, onGallery, onFiles }: { onClose: () => void; onCamera: () => void; onGallery: () => void; onFiles: () => void }) {
  const options = [
    { title: "Take photo", subtitle: "Use the camera", Icon: Camera },
    { title: "Choose from gallery", subtitle: "Photos on this device", Icon: ImageIcon },
    { title: "Browse files", subtitle: "PDF, PNG or JPG up to 10 MB", Icon: Folder },
  ];
  const actions = [onCamera, onGallery, onFiles];
  return <View style={s.overlay}>
    <Pressable style={s.overlayTap} onPress={onClose} />
    <SlideUpSheet style={uploadOptions.sheet}>
      <View style={s.handle} />
      <View style={uploadOptions.head}>
        <View><Text style={uploadOptions.title}>Upload bill</Text><Text style={uploadOptions.subtitle}>Westside Retail · RBC **** 5614</Text></View>
        <Pressable style={s.close} onPress={onClose}><Text style={s.closeText}>×</Text></Pressable>
      </View>
      {options.map(({ title, subtitle, Icon }, index) => <Pressable key={title} onPress={actions[index]} style={uploadOptions.option}>
        <View style={uploadOptions.icon}><Icon size={25} color="#5C70FF" strokeWidth={2.2} /></View>
        <View style={uploadOptions.optionText}><Text style={uploadOptions.optionTitle}>{title}</Text><Text style={uploadOptions.optionSub}>{subtitle}</Text></View>
      </Pressable>)}
    </SlideUpSheet>
  </View>;
}

function CsvUploadSheet({ token, workspace, selectedBankId, onClose, onImported }: { token: string; workspace: Workspace | null; selectedBankId: string | null; onClose: () => void; onImported: () => void }) {
  const [file, setFile] = useState<{ uri: string; name: string; mimeType?: string | null } | null>(null);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const choose = async () => { const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'], copyToCacheDirectory: true }); if (!result.canceled) { const asset = result.assets[0]; setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType }); setMessage(''); } };
  const upload = async () => { if (!workspace?.activeBusiness || !file) { setMessage('Choose a CSV file first.'); return; } if (!selectedBankId) { setMessage('Select an institution first.'); return; } setBusy(true); setMessage(''); try { const result = await importTransactionsCsv(token, { businessId: workspace.activeBusiness.id, bankAccountId: selectedBankId, file }); setMessage(`${result.imported} transactions imported${result.skippedRows.length ? `; ${result.skippedRows.length} rows skipped.` : '.'}`); setTimeout(onImported, 850); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to import the CSV.'); } finally { setBusy(false); } };
  return <View style={s.overlay}>
    <Pressable style={s.overlayTap} onPress={onClose} />
    <SlideUpSheet style={uploadOptions.sheet}>
      <View style={s.handle} />
      <View style={uploadOptions.head}>
        <View><Text style={uploadOptions.title}>Upload CSV</Text><Text style={uploadOptions.subtitle}>{workspace?.activeBusiness?.name ?? 'Choose a business first'}</Text></View>
        <Pressable style={s.close} onPress={onClose}><Text style={s.closeText}>×</Text></Pressable>
      </View>
      <Pressable onPress={choose} style={uploadOptions.option}>
        <View style={uploadOptions.icon}><FileText size={25} color="#5C70FF" strokeWidth={2.2} /></View>
        <View style={uploadOptions.optionText}><Text style={uploadOptions.optionTitle}>{file?.name ?? 'Choose CSV file'}</Text><Text style={uploadOptions.optionSub}>{file ? 'Ready to import' : 'CSV columns: date, merchant/description, amount'}</Text></View>
      </Pressable>
      {!!message && <Text style={{ color: message.includes('imported') ? '#159148' : '#D9363E', textAlign: 'center', fontWeight: '700', marginVertical: 10 }}>{message}</Text>}
      <Pressable onPress={upload} disabled={busy || !file} style={[uploadOptions.option, { justifyContent: 'center', backgroundColor: file ? '#5C70FF' : '#A7B1FA', borderWidth: 0 }]}><Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>{busy ? 'Importing…' : 'Import transactions'}</Text></Pressable>
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
  account = false,
  onGoogle,
  onAccountSelected,
  onEmail,
  email,
  onEmailChange,
  busy,
  error,
}: {
  account?: boolean;
  onGoogle: () => void;
  onAccountSelected: () => void;
  onEmail: () => void;
  email: string;
  onEmailChange: (value: string) => void;
  busy: boolean;
  error: string;
}) {
  const accountSheetY = useRef(new Animated.Value(480)).current;
  useEffect(() => {
    if (account) {
      Animated.timing(accountSheetY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      accountSheetY.setValue(480);
    }
  }, [account, accountSheetY]);
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
          <BrandMark />
        </View>
        <BrandWordmark />
        <Text style={s.brandTagline}>BUSINESS FINANCE</Text>
      </View>
      <Animated.View style={[s.sheet, account && s.accountSheet, account && { transform: [{ translateY: accountSheetY }] }]}>
        {account ? (
          <>
            <View style={s.handle} />
            <View style={s.accountGoogle}><GoogleIcon size={30} /></View>
            <Text style={s.choose}>Choose an account</Text>
            <Text style={s.chooseSub}>to continue to MediAccounts</Text>
            <Account
              name="Simran Kaur"
              email="simran@westsideretail.ca"
              initials="SK"
              color="#596CF8"
              onPress={onAccountSelected}
            />
            <Account
              name="Daniel Chen"
              email="daniel.chen@outlook.com"
              initials="DC"
              color="#148A43"
              onPress={onAccountSelected}
            />
            <Account
              name="Simran Kaur"
              email="simran.kaur@gmail.com"
              initials="S"
              color="#14203B"
              selected
              onPress={onAccountSelected}
            />
            <Pressable onPress={onAccountSelected} style={s.other}>
              <View style={s.otherIcon}><UserPlus size={23} color="#71809C" /></View>
              <Text style={s.otherText}>Use another account</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={loginTitle}>Sign in</Text>
            <Text style={loginDesc}>
              Track spending and bills for your business.
            </Text>
            <Pressable onPress={onGoogle} style={s.googleBtn}>
              <View style={s.googleIconWrap}><GoogleIcon /></View>
              <Text style={s.googleBtnText}>Continue with Google</Text>
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
                  {busy ? "Sending…" : "Send code"}
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
        )}
      </Animated.View>
    </View>
  );
}

function Otp({ email, code, onCodeChange, busy, error, onBack, onNext, onResend }: { email: string; code: string; onCodeChange: (value: string) => void; busy: boolean; error: string; onBack: () => void; onNext: () => void; onResend: () => void }) {
  return (
    <View style={otp.screen}>
      <StatusBar style="dark" />
      <Pressable onPress={onBack} style={otp.back}>
        <Text style={otp.backText}>‹</Text>
      </Pressable>
      <View style={otp.body}>
        <View style={otp.mailIcon}><Mail size={28} color="#FFF" strokeWidth={2.1} /></View>
        <Text style={otp.title}>Check your email</Text>
        <Text style={otp.subtitle}>We sent a 6-digit code to</Text>
        <View style={otp.emailChip}><Mail size={18} color="#5C70FF" /><Text style={otp.emailText}>{email}</Text></View>
      <View style={otp.cells}>
        {Array.from({ length: 6 }, (_, i) => code[i] ?? "").map((v, i) => (
          <View style={[otp.cell, v && otp.filledCell]} key={i}>
            <Text style={otp.cellText}>{v}</Text>
          </View>
        ))}
      </View>
      <TextInput value={code} onChangeText={(value) => onCodeChange(value.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" maxLength={6} editable={!busy} placeholder="Enter 6-digit code" placeholderTextColor="#9AA6BF" style={otp.codeInput} />
      {!!error && <Text style={otp.error}>{error}</Text>}
      <Pressable onPress={onNext} disabled={busy || code.length !== 6} style={[otp.continue, (busy || code.length !== 6) && otp.continueDisabled]}>
        <Text style={otp.continueText}>{busy ? "Checking…" : "Continue"}</Text>
      </Pressable>
      <View style={otp.actions}>
        <Pressable onPress={onResend} disabled={busy}><Text style={otp.resend}>Resend code</Text></Pressable>
        <View style={otp.actionDivider} />
        <Pressable onPress={onBack}>
          <Text style={otp.change}>Change email</Text>
        </Pressable>
      </View>
      </View>
    </View>
  );
}

const otp = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFF", paddingTop: 52, paddingHorizontal: 26 },
  back: { width: 48, height: 48, borderRadius: 15, borderWidth: 1, borderColor: "#DCE3F5", alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 28, color: "#17223A", marginTop: -4 },
  body: { flex: 1, alignItems: "center", paddingTop: 100 },
  mailIcon: { height: 58, width: 58, borderRadius: 19, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center" },
  title: { marginTop: 22, fontSize: 25, fontWeight: "800", color: "#101A32" },
  subtitle: { marginTop: 10, fontSize: 15, color: "#66748F" },
  emailChip: { marginTop: 11, backgroundColor: "#F0F2FF", borderWidth: 1, borderColor: "#D9DFFF", borderRadius: 19, height: 38, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 7 },
  emailText: { fontSize: 14, fontWeight: "600", color: "#5C70FF" },
  cells: { width: "100%", flexDirection: "row", gap: 7, marginTop: 34 },
  cell: { flex: 1, height: 58, borderRadius: 14, borderWidth: 1, borderColor: "#D9E1FB", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  filledCell: { borderColor: "#5C70FF", backgroundColor: "#FAFBFF" },
  cellText: { fontSize: 22, fontWeight: "700", color: "#101A32" },
  codeInput: { width: "100%", height: 50, borderRadius: 14, borderWidth: 1, borderColor: "#D9E1FB", color: "#101A32", fontSize: 17, paddingHorizontal: 16, marginTop: 12, textAlign: "center", letterSpacing: 4 },
  error: { color: "#D9363E", fontSize: 13, textAlign: "center", marginTop: 10 },
  continue: { alignSelf: "stretch", height: 58, borderRadius: 17, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center", marginTop: 20 },
  continueDisabled: { backgroundColor: "#A6B0FA" },
  continueText: { fontSize: 17, fontWeight: "800", color: "#FFF" },
  actions: { flexDirection: "row", alignItems: "center", gap: 20, marginTop: 22 },
  resend: { fontSize: 14, fontWeight: "700", color: "#5C70FF" },
  actionDivider: { height: 20, width: 1, backgroundColor: "#DFE4F0" },
  change: { fontSize: 14, fontWeight: "600", color: "#17223A" },
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
        <View
          style={{
            height: 36,
            width: 36,
            borderRadius: 12,
            backgroundColor: "#5C70FF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 19, fontWeight: "700" }}>
            $
          </Text>
        </View>
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
          <View
            style={{
              height: 34,
              width: 34,
              borderRadius: 11,
              backgroundColor: "#5C70FF",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFF", fontSize: 19, fontWeight: "900" }}>
              $
            </Text>
          </View>
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

function NewBusiness({
  onBack,
  onCreate,
  token,
}: {
  onBack: () => void;
  onCreate: (business: AuthSession['businesses'][number]) => Promise<void>;
  token: string;
}) {
  const [name, setName] = useState("");
  const [aliasName, setAliasName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [institutions, setInstitutions] = useState([{ name: "", accountNumber: "", accountType: "Chequing Account", isPrimary: true }]);
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
  const ready = !!name.trim() && !!businessAddress.trim() && institutions.every((item) => item.name.trim() && item.accountNumber.trim()) && !saving;
  const updateInstitution = (index: number, patch: Partial<typeof institutions[number]>) => setInstitutions((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const addressSuggestions = [
    { label: '11 Polson Street', address: '11 Polson Street', city: 'Toronto', province: 'ON', postalCode: 'M5A 1A4' },
    { label: '11 Yorkville Avenue', address: '11 Yorkville Avenue', city: 'Toronto', province: 'ON', postalCode: 'M4W 0B7' },
    { label: '11 Wellesley Street West', address: '11 Wellesley Street West', city: 'Toronto', province: 'ON', postalCode: 'M4Y 1E8' },
    { label: '110 Aeropark Boulevard', address: '110 Aeropark Boulevard', city: 'Hamilton', province: 'ON', postalCode: 'L0R 1W0' },
  ].filter((item) => item.label.toLowerCase().includes(businessAddress.toLowerCase()));
  const create = async () => {
    if (!ready) return;
    setSaving(true); setError("");
    try {
      const result = await createBusiness(token, { name: name.trim(), aliasName: aliasName.trim(), businessAddress: businessAddress.trim(), addressLine2: addressLine2.trim(), city: city.trim(), province: province.trim(), postalCode: postalCode.trim(), institutions });
      await onCreate(result.business);
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
        <Pressable
          onPress={onBack}
          style={{
            height: 38,
            width: 38,
            borderRadius: 11,
            borderWidth: 1,
            borderColor: "#E1E6F0",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 25, color: "#101A32" }}>‹</Text>
        </Pressable>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#101A32" }}>
          Add business
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 35, gap: 14 }}
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
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: "#101A32",
              marginBottom: 16,
            }}
          >
            Business
          </Text>
          <Text style={label}>Business name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Westside Retail"
            style={field}
          />
          <Text style={[label, { marginTop: 15 }]}>Alias name</Text>
          <TextInput value={aliasName} onChangeText={setAliasName} placeholder="Short name shown in the app" style={field} />
          <Text style={[label, { marginTop: 15 }]}>Business address *</Text>
          <TextInput value={businessAddress} onChangeText={(value) => { setBusinessAddress(value); setShowAddressSuggestions(true); }} onFocus={() => setShowAddressSuggestions(true)} placeholder="Street address" style={field} />
          {showAddressSuggestions && businessAddress.length > 0 && <View style={{ borderWidth: 1, borderColor: '#E1E6F0', borderRadius: 13, backgroundColor: '#FFF', marginTop: 6, overflow: 'hidden' }}>{addressSuggestions.map((item) => <Pressable key={item.label} onPress={() => { setBusinessAddress(item.address); setAddressLine2(item.address); setCity(item.city); setProvince(item.province); setPostalCode(item.postalCode); setShowAddressSuggestions(false); }} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#EDF0F5' }}><Text style={{ color: '#17223A', fontWeight: '700' }}>{item.label}</Text><Text style={{ color: '#71809A', fontSize: 12, marginTop: 2 }}>{item.city}, {item.province}, Canada</Text></Pressable>)}</View>}
          <Text style={[label, { marginTop: 15 }]}>Address</Text>
          <TextInput value={addressLine2} onChangeText={setAddressLine2} placeholder="Unit, suite, or additional address" style={field} />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 15 }}><View style={{ flex: 1 }}><Text style={label}>City</Text><TextInput value={city} onChangeText={setCity} placeholder="City" style={field}/></View><View style={{ flex: 1 }}><Text style={label}>Province</Text><TextInput value={province} onChangeText={setProvince} placeholder="BC" style={field}/></View></View>
          <Text style={[label, { marginTop: 15 }]}>Postal code</Text>
          <TextInput value={postalCode} onChangeText={setPostalCode} placeholder="A1A 1A1" style={field}/>
        </View>
        <View style={{ padding: 17, borderRadius: 21, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E7EAF3" }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><Text style={{ fontSize: 16, fontWeight: "800", color: "#101A32" }}>Institution</Text><Pressable onPress={() => setInstitutions((items) => [...items, { name: '', accountNumber: '', accountType: 'Chequing Account', isPrimary: false }])}><Text style={{ color: '#2463EB', fontWeight: '800' }}>＋ Add more</Text></Pressable></View>
          {institutions.map((institution, index) => <View key={index} style={{ borderTopWidth: index ? 1 : 0, borderColor: '#E7EAF3', paddingTop: index ? 16 : 0, marginTop: index ? 16 : 0 }}><Text style={label}>Institution name *</Text><TextInput value={institution.name} onChangeText={(value) => updateInstitution(index, { name: value })} placeholder="e.g. RBC" style={field}/><Text style={[label, { marginTop: 15 }]}>Account type</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{['Savings Account','Chequing Account','Credit Card','Debit Card','Joint Account','Business Account'].map((type) => <Pressable key={type} onPress={() => updateInstitution(index, { accountType: type })} style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: institution.accountType === type ? '#EAF0FF' : '#F5F7FB' }}><Text style={{ color: institution.accountType === type ? '#2463EB' : '#66748F', fontSize: 12, fontWeight: '700' }}>{type.replace(' Account','')}</Text></Pressable>)}</View><Text style={[label, { marginTop: 15 }]}>{institution.accountType} number *</Text><TextInput keyboardType="number-pad" value={institution.accountNumber} onChangeText={(value) => updateInstitution(index, { accountNumber: value })} placeholder="Account number" style={field}/><Pressable onPress={() => setInstitutions((items) => items.map((item, itemIndex) => ({ ...item, isPrimary: itemIndex === index })))} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 }}><View style={{ height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#5C70FF', alignItems: 'center', justifyContent: 'center' }}>{institution.isPrimary && <View style={{ height: 10, width: 10, borderRadius: 5, backgroundColor: '#5C70FF' }}/>}</View><Text style={{ color: '#17223A', fontWeight: '700' }}>Primary</Text></Pressable></View>)}
        </View>
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
      </ScrollView>
    </View>
  );
}
function Account({
  name,
  email,
  initials,
  color,
  selected = false,
  onPress,
}: {
  name: string;
  email: string;
  initials: string;
  color: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[s.account, selected && s.accountSelected]}>
      <View style={[s.avatar, { backgroundColor: color }]}>
        <Text style={s.avatarText}>{initials}</Text>
      </View>
      <View>
        <Text style={s.accountName}>{name}</Text>
        <Text style={s.email}>{email}</Text>
      </View>
    </Pressable>
  );
}

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

function transactionSummary(transactions: FinanceTransaction[]) {
  return { spent: transactions.reduce((sum, item) => sum + Math.abs(numberValue(item.amount)), 0), categoryCount: new Set(transactions.map((item) => item.category).filter(Boolean)).size, billsMissing: transactions.filter((item) => item.billStatus === 'missing').length, gstClaimable: transactions.reduce((sum, item) => sum + numberValue(item.gst), 0), transactionCount: transactions.length };
}

function MarqueeRemark({ text }: { text: string }) {
  const translate = useRef(new Animated.Value(0)).current;
  const shouldScroll = text.length > 26;
  useEffect(() => {
    if (!shouldScroll) { translate.setValue(0); return; }
    const animation = Animated.loop(Animated.sequence([Animated.delay(850), Animated.timing(translate, { toValue: -145, duration: 3000, easing: Easing.linear, useNativeDriver: true }), Animated.delay(700), Animated.timing(translate, { toValue: 0, duration: 1, useNativeDriver: true })]));
    animation.start();
    return () => animation.stop();
  }, [shouldScroll, text, translate]);
  return <View style={{ overflow: 'hidden', height: 22 }}><Animated.Text numberOfLines={1} style={[ui.homeMerchant, { transform: [{ translateX: translate }] }]}>{text}</Animated.Text></View>;
}

function SummaryMarquee({ text, style, scrollAfter = 25 }: { text: string; style: object; scrollAfter?: number }) {
  const translate = useRef(new Animated.Value(0)).current;
  const shouldScroll = text.length > scrollAfter;
  useEffect(() => {
    if (!shouldScroll) { translate.setValue(0); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(1000),
      Animated.timing(translate, { toValue: -170, duration: 3200, easing: Easing.linear, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(translate, { toValue: 0, duration: 1, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [shouldScroll, text, translate]);
  return <View style={{ width: '100%', overflow: 'hidden' }}><Animated.Text numberOfLines={1} style={[style, { transform: [{ translateX: translate }] }]}>{text}</Animated.Text></View>;
}

function Dashboard({
  workspace,
  error,
  notice,
  selectedBankId,
  selectedPeriod,
  onBusiness,
  onBank,
  onPeriod,
  onTransactions,
  onDetails,
  onUpload,
  onImport,
}: {
  workspace: Workspace | null;
  error: string;
  notice: string;
  selectedBankId: string | null;
  selectedPeriod: 'This month' | 'Last month' | 'This quarter' | 'Year to date';
  onBusiness: () => void;
  onBank: () => void;
  onPeriod: () => void;
  onTransactions: () => void;
  onDetails: (id: string) => void;
  onUpload: () => void;
  onImport: () => void;
}) {
  const scopedTransactions = transactionsForPeriod((workspace?.transactions ?? []).filter((item) => !selectedBankId || item.bankAccountId === selectedBankId), selectedPeriod);
  const recentTransactions = scopedTransactions.slice(0, 5);
  const dashboard = transactionSummary(scopedTransactions);
  const activeBusiness = workspace?.activeBusiness;
  const activeBank = workspace?.bankAccounts.find((account) => account.id === selectedBankId) ?? workspace?.bankAccounts[0];
  return (
    <ScrollView
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
            <Building2 size={18} color="#69758C" />
            <Text numberOfLines={1} style={ui.selectorText}>
              {activeBusiness?.name ?? "Loading business…"}
            </Text>
            <ChevronDown size={18} color="#8F9AB0" />
          </View>
        </Pressable>
        <Pressable onPress={onBank} style={{ flex: 1 }}>
          <Text style={ui.fieldLabel}>BANK ACCOUNT</Text>
          <View style={ui.selector}>
            <Building2 size={18} color="#69758C" />
            <Text numberOfLines={1} style={ui.selectorText}>
              {activeBank ? `${activeBank.name.replace('Business Chequing', '').trim()} ${activeBank.maskedNumber}` : "No bank account"}
            </Text>
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
      <View style={ui.actionGrid}>
        <Pressable onPress={onUpload} style={ui.actionTile}><View style={ui.actionIcon}><CloudUpload size={25} color="#5C70FF" /></View><Text style={ui.actionLabel}>Upload Bill</Text></Pressable>
        <Pressable onPress={onImport} style={ui.actionTile}><View style={ui.actionIcon}><FileText size={24} color="#5C70FF" /></View><Text style={ui.actionLabel}>Upload CSV</Text></Pressable>
        <Pressable onPress={() => {}} style={ui.actionTile}><View style={ui.actionIcon}><Download size={24} color="#5C70FF" /></View><Text style={ui.actionLabel}>Export</Text></Pressable>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 26,
          marginBottom: 12,
        }}
      >
        <Text style={ui.recentHeading}>RECENT TRANSACTIONS</Text>
        <Pressable onPress={onTransactions} style={{ marginLeft: "auto" }}>
          <Text style={ui.viewAll}>View all</Text>
        </Pressable>
      </View>
      <View style={ui.homeTransactionList}>
      {!!error && <Text style={{ color: '#D9363E', padding: 16, textAlign: 'center' }}>{error}</Text>}
      {recentTransactions.map((item, index) => {
        const hasBill = item.billStatus === 'attached';
        return <Pressable onPress={() => onDetails(item.id)} key={item.id} style={[ui.homeTransactionRow, index !== recentTransactions.length - 1 && ui.homeTransactionBorder]}>
          <View style={[ui.homeBillIcon, !hasBill && ui.homeMissingBill]}>
            {hasBill ? <><ReceiptText size={23} color="#FFF" /><View style={ui.homeCheck}><Text style={ui.homeCheckText}>✓</Text></View></> : <Text style={ui.homePlus}>＋</Text>}
          </View>
          <View style={ui.homeTransactionInfo}><MarqueeRemark text={item.description || item.merchant} /><Text style={ui.homeMeta}>{item.postedLabel} · {item.category}</Text></View>
          <View style={ui.homeAmountArea}>
            <Text style={ui.homeAmount}>{money(item.amount)}</Text>
            <View style={[ui.homeBillBadge, hasBill ? ui.homeBillBadgeAttached : ui.homeBillBadgeMissing]}>
              {hasBill ? <Text style={ui.homeBillCheck}>✓</Text> : <Upload size={11} color="#E13B48" strokeWidth={2.5} />}
              <Text style={[ui.homeBillBadgeText, hasBill ? ui.homeBillAttachedText : ui.homeBillMissingText]}>{hasBill ? "Bill attached" : "Add bill"}</Text>
            </View>
          </View>
        </Pressable>;
      })}
      {!recentTransactions.length && !error && <Text style={{ color: '#71809A', padding: 20, textAlign: 'center' }}>No transactions yet.</Text>}
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
  actionGrid: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionTile: { flex: 1, height: 124, borderRadius: 22, borderWidth: 1, borderColor: "#E2E6EF", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  actionIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: "#EEF0FF", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  actionLabel: { fontSize: 14, fontWeight: "700", color: "#1D2840" },
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
  viewAll: { color: "#5C70FF", fontSize: 14, fontWeight: "700" },
  homeTransactionList: { borderWidth: 1, borderColor: "#E2E6EF", borderRadius: 22, backgroundColor: "#FFF", overflow: "hidden" },
  homeTransactionRow: { minHeight: 76, paddingHorizontal: 20, flexDirection: "row", alignItems: "center" },
  homeTransactionBorder: { borderBottomWidth: 1, borderColor: "#E9EDF3" },
  homeBillIcon: { width: 48, height: 50, borderRadius: 15, backgroundColor: "#14203B", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0, alignSelf: "center" },
  homeMissingBill: { backgroundColor: "#FFF", borderWidth: 1, borderStyle: "dashed", borderColor: "#BCC8E2" },
  homePlus: { color: "#7B89A6", fontSize: 25 },
  homeCheck: { width: 18, height: 18, borderRadius: 10, backgroundColor: "#159148", borderWidth: 2, borderColor: "#FFF", position: "absolute", right: -5, bottom: -5, alignItems: "center", justifyContent: "center" },
  homeCheckText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  homeTransactionInfo: { flex: 1, minWidth: 0, minHeight: 46, marginLeft: 13, marginRight: 8, justifyContent: "center" },
  homeMerchant: { color: "#1D2840", fontSize: 16, fontWeight: "700" },
  homeMeta: { color: "#8B98B0", fontSize: 14, marginTop: 4 },
  homeAmountArea: { width: 122, minHeight: 46, alignItems: "flex-end", justifyContent: "center", flexShrink: 0, gap: 5 },
  homeAmount: { color: "#17223A", fontSize: 16, fontWeight: "800" },
  homeBillBadge: { height: 26, borderRadius: 13, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 4 },
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

function TransactionDetails({ transaction, token, onChanged, onBack }: { transaction?: FinanceTransaction; token: string; onChanged: () => void; onBack: () => void }) {
  const [sheet,setSheet]=useState(''); const [category,setCategory]=useState(transaction?.category ?? 'Uncategorized'); const [categoryOptions,setCategoryOptions]=useState<string[]>([]); const [memo,setMemo]=useState(transaction?.memo ?? ''); const [gst,setGst]=useState(String(transaction?.gst ?? 0)); const [pst,setPst]=useState(String(transaction?.pst ?? 0)); const [gstAtFivePercent,setGstAtFivePercent]=useState(false); const [pendingBill,setPendingBill]=useState<{ uri: string; name: string; mimeType?: string | null } | null>(null); const [availableBills,setAvailableBills]=useState<AvailableBill[]>([]); const [selectedExistingBillId,setSelectedExistingBillId]=useState(''); const [previewUri,setPreviewUri]=useState(''); const [previewError,setPreviewError]=useState(''); const [saving,setSaving]=useState(false); const [message,setMessage]=useState('');
  const fivePercentGst = Math.abs(Number(transaction?.amount ?? 0)) * 0.05;
  useEffect(() => { const transactionCategory = transaction?.category?.trim() || 'Uncategorized'; setCategory(transactionCategory); setMemo(transaction?.memo ?? ''); setGst(String(transaction?.gst ?? 0)); setPst(String(transaction?.pst ?? 0)); setGstAtFivePercent(fivePercentGst > 0 && Math.abs(Number(transaction?.gst ?? 0) - fivePercentGst) < 0.01); setPendingBill(null); setSelectedExistingBillId(''); setMessage(''); }, [transaction?.id]);
  useEffect(() => { if (!token || !transaction?.businessId) { setCategoryOptions([]); return; } void getWorkspace(token, transaction.businessId).then((workspace) => { const options = Array.from(new Set(workspace.transactions.map((item) => item.category?.trim()).filter((item): item is string => !!item))).sort(); setCategoryOptions(options); }).catch(() => setCategoryOptions([])); }, [token, transaction?.businessId]);
  useEffect(() => { if (!transaction || !token || transaction.billStatus === 'attached') { setAvailableBills([]); return; } void getAvailableBills(token, transaction.businessId, transaction.bankAccountId).then(({ bills }) => setAvailableBills(bills)).catch(() => setAvailableBills([])); }, [token, transaction?.id, transaction?.businessId, transaction?.bankAccountId, transaction?.billStatus]);
  useEffect(() => {
    if (pendingBill) { setPreviewUri(''); setPreviewError(''); return; }
    const selectedBill = availableBills.find((bill) => bill.id === selectedExistingBillId);
    const target = selectedBill?.mimeType?.startsWith('image/')
      ? { url: billFileUrl(selectedBill.id), key: selectedBill.id, mimeType: selectedBill.mimeType }
      : !selectedExistingBillId && transaction?.billStatus === 'attached' && transaction.billMimeType?.startsWith('image/')
        ? { url: transactionBillFileUrl(transaction.id), key: transaction.id, mimeType: transaction.billMimeType }
        : null;
    if (!target) { setPreviewUri(''); setPreviewError(''); return; }
    let cancelled = false;
    setPreviewUri(''); setPreviewError('');
    void downloadBillPreview(token, target.url, target.key, target.mimeType)
      .then((uri) => { if (!cancelled) setPreviewUri(uri); })
      .catch(() => { if (!cancelled) setPreviewError('The bill image could not be loaded.'); });
    return () => { cancelled = true; };
  }, [token, transaction?.id, transaction?.billStatus, transaction?.billMimeType, pendingBill, availableBills, selectedExistingBillId]);
  const chooseBill = async () => { const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true }); if (!result.canceled) { const asset = result.assets[0]; setPendingBill({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType }); setSelectedExistingBillId(''); setMessage('Bill ready to save to this transaction.'); } };
  const save = async () => { if (!transaction || !token) return; const parsedGst = Number(gst); const parsedPst = Number(pst); if (!Number.isFinite(parsedGst) || !Number.isFinite(parsedPst)) { setMessage('GST and PST must be valid amounts.'); return; } setSaving(true); setMessage(''); try { await updateTransaction(token, transaction.id, { category, memo, gst: parsedGst, pst: parsedPst }); if (pendingBill) await uploadBill(token, transaction.id, pendingBill); else if (selectedExistingBillId) await attachExistingBill(token, transaction.id, selectedExistingBillId); await onChanged(); const matched = !!pendingBill || !!selectedExistingBillId; setPendingBill(null); setSelectedExistingBillId(''); setMessage(matched ? 'Bill attached to this transaction.' : 'Changes saved.'); } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to save changes.'); } finally { setSaving(false); } };
  const attached = transaction?.billStatus === 'attached';
  return (
    <View style={{flex:1,backgroundColor:'#F4F6FA'}}><ScrollView contentContainerStyle={detail.screen}>
      <View style={detail.header}>
        <Pressable onPress={onBack} style={detail.back}>
          <Text style={detail.backText}>‹</Text>
        </Pressable>
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
        <View style={detail.fieldPair}><View style={detail.field}><Text style={detail.label}>GST</Text><View style={detail.taxInput}><TextInput value={gst} onChangeText={(value) => { setGst(value); setGstAtFivePercent(false); }} keyboardType="decimal-pad" style={detail.taxValue}/><Pressable onPress={() => { const enabled = !gstAtFivePercent; setGstAtFivePercent(enabled); if (enabled) setGst(fivePercentGst.toFixed(2)); }} style={detail.taxToggle}><View style={[detail.taxCheckbox, gstAtFivePercent && detail.taxCheckboxSelected]}>{gstAtFivePercent && <Text style={detail.taxCheckmark}>✓</Text>}</View><Text style={detail.taxToggleText}>5%</Text></Pressable></View></View><View style={detail.field}><Text style={detail.label}>PST</Text><TextInput value={pst} onChangeText={setPst} keyboardType="decimal-pad" style={detail.input}/></View></View>
        <View style={detail.fieldPair}><View style={detail.field}><Text style={detail.label}>Category</Text><Pressable onPress={()=>setSheet('category')} style={[detail.input,detail.selectInput]}><Text style={detail.value}>{category}</Text><ChevronDown size={18} color="#8A96AC" /></Pressable></View><View style={detail.field}><Text style={detail.label}>Memo</Text><TextInput value={memo} onChangeText={setMemo} placeholder="Add a note" placeholderTextColor="#9AA6BD" style={detail.input}/></View></View>
      </View>
      <View style={detail.billPanel}>
        <Text style={detail.billTitle}>Bill</Text>
        <Pressable onPress={chooseBill} style={detail.billFile}><View style={detail.fileIcon}><FileText size={28} color="#A2AECB" /></View><View style={detail.fileInfo}><Text numberOfLines={1} style={detail.fileName}>{pendingBill?.name ?? transaction?.billName ?? 'Upload bill'}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={detail.fileMeta}>{pendingBill ? 'Ready to save to this transaction only' : transaction?.billSizeBytes ? `${Math.round(transaction.billSizeBytes / 1024)} KB · Uploaded by ${transaction.billUploadedBy ?? 'you'}` : 'Photo or PDF · this transaction only'}</Text></View><View style={[detail.fileBadge, !attached && { backgroundColor: '#FDEBEC' }]}>{attached && !pendingBill && <Text style={detail.fileCheck}>✓</Text>}<Text style={[detail.fileBadgeText, (!attached || pendingBill) && { color: '#D9363E' }]}>{pendingBill ? 'Ready' : attached ? 'Matched' : 'Upload'}</Text></View></Pressable>
        {!attached && availableBills.map((bill) => <Pressable key={bill.id} onPress={() => { setSelectedExistingBillId(bill.id); setPendingBill(null); setMessage('Existing bill ready to save to this transaction.'); }} style={[detail.availableBill, selectedExistingBillId === bill.id && detail.availableBillSelected]}><View style={{ flex: 1 }}><Text style={detail.availableBillTitle}>{bill.mimeType.startsWith('image/') ? 'Uploaded photo available' : 'Uploaded bill available'}</Text><Text numberOfLines={1} style={detail.fileMeta}>{bill.mimeType.startsWith('image/') ? 'Tap to preview and attach this photo' : bill.fileName}</Text></View>{selectedExistingBillId === bill.id && <Text style={detail.fileCheck}>✓</Text>}</Pressable>)}
        {pendingBill?.mimeType?.startsWith('image/') && <Image source={{ uri: pendingBill.uri }} style={detail.billPreview} resizeMode="contain" />}{!pendingBill && !!previewUri && <Image source={{ uri: previewUri }} style={detail.billPreview} resizeMode="contain" />}{!pendingBill && !!previewError && <Text style={detail.previewError}>{previewError}</Text>}
      </View>
      {!!message && <Text style={{ color: /ready|saved|attached/i.test(message) ? '#159148' : '#D9363E', textAlign: 'center', fontWeight: '700', marginTop: 14 }}>{message}</Text>}
      <Pressable onPress={save} disabled={saving || !transaction} style={[detail.save, (!transaction || saving) && { opacity: 0.55 }]}><Text style={detail.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text></Pressable>
    </ScrollView>{sheet==='category'&&<DetailSheet title="Category" items={Array.from(new Set([category, ...categoryOptions]))} selected={category} onChoose={(x)=>{setCategory(x);setSheet('')}} close={()=>setSheet('')}/>} {sheet==='bill'&&<DetailSheet title="Add bill" items={['Take photo\nUse the camera','Choose from gallery\nPhotos on this device','Browse files\nPDF, PNG or JPG up to 10 MB']} selected="" onChoose={()=>setSheet('')} close={()=>setSheet('')}/>}</View>
  );
}
function DetailSheet({title,items,selected,onChoose,close}:{title:string,items:string[],selected:string,onChoose:(x:string)=>void,close:()=>void}){return <View style={s.overlay}><Pressable style={s.overlayTap} onPress={close}/><SlideUpSheet style={detail.sheet}><View style={s.handle}/><View style={detail.sheetHead}><Text style={detail.sheetTitle}>{title}</Text><Pressable style={s.close} onPress={close}><Text style={s.closeText}>×</Text></Pressable></View>{items.map(x=><Pressable key={x} onPress={()=>onChoose(x.split('\n')[0])} style={[detail.sheetRow,x===selected&&detail.sheetSelected]}><Text style={detail.sheetName}>{x.split('\n')[0]}</Text>{x.includes('\n')&&<Text style={detail.sheetSub}>{x.split('\n')[1]}</Text>}{x===selected&&<Text style={s.check}>✓</Text>}</Pressable>)}</SlideUpSheet></View>}
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
  availableBill: { marginTop: 10, minHeight: 72, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#DDE4F0', backgroundColor: '#F9FAFD', flexDirection: 'row', alignItems: 'center' },
  availableBillSelected: { borderColor: '#5C70FF', borderWidth: 2, backgroundColor: '#F2F4FF' },
  availableBillTitle: { color: '#17223A', fontWeight: '800', marginBottom: 4 },
  availableBillPreview: { width: 100, height: 66, borderRadius: 9, marginTop: 8, backgroundColor: '#E9EDF3' },
});

function UploadBill({ token, workspace, transactions, selectedBankId, preferredTransactionId, initialFile, onChooseMedia, onBack, onSaved }: { token: string; workspace: Workspace | null; transactions: FinanceTransaction[]; selectedBankId: string | null; preferredTransactionId: string | null; initialFile: { uri: string; name: string; mimeType?: string | null } | null; onChooseMedia: (source: 'camera' | 'gallery') => void; onBack: () => void; onSaved: (transactionId: string) => void }) {
  const missing = transactions.filter((item) => item.billStatus === 'missing');
  const [transactionId, setTransactionId] = useState(preferredTransactionId ?? missing[0]?.id ?? '');
  const [file, setFile] = useState<{ uri: string; name: string; mimeType?: string | null } | null>(null);
  const [availableBills, setAvailableBills] = useState<AvailableBill[]>([]); const [selectedBillId, setSelectedBillId] = useState(''); const [loadingBills, setLoadingBills] = useState(false);
  const [saving, setSaving] = useState(false); const [message, setMessage] = useState('');
  const chooseFile = async () => { const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true }); if (!result.canceled) { const asset = result.assets[0]; setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType }); setSelectedBillId(''); setMessage(''); } };
  useEffect(() => { if (initialFile) { setFile(initialFile); setSelectedBillId(''); } }, [initialFile]);
  useEffect(() => { if (preferredTransactionId) setTransactionId(preferredTransactionId); }, [preferredTransactionId]);
  useEffect(() => { if (!workspace?.activeBusiness || !token || !selectedBankId) return; setLoadingBills(true); void getAvailableBills(token, workspace.activeBusiness.id, selectedBankId).then(({ bills }) => setAvailableBills(bills)).catch(() => setAvailableBills([])).finally(() => setLoadingBills(false)); }, [token, workspace?.activeBusiness?.id, selectedBankId]);
  const save = async () => { if (!file && !selectedBillId) { setMessage('Choose a bill to match first.'); return; } if (!transactionId) { setMessage('Select the transaction that this bill belongs to.'); return; } setSaving(true); setMessage(''); try { if (file) await uploadBill(token, transactionId, file); else await attachExistingBill(token, transactionId, selectedBillId); setMessage('Bill matched to this transaction.'); setTimeout(() => onSaved(transactionId), 650); } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to save the bill match.'); } finally { setSaving(false); } };
  const selectedTransaction = transactions.find((item) => item.id === transactionId);
  return <View style={{flex:1,backgroundColor:'#F4F6FA'}}><ScrollView contentContainerStyle={uploadScreen.screen}><View style={uploadScreen.header}><Pressable onPress={onBack} style={uploadScreen.back}><Text style={uploadScreen.backText}>‹</Text></Pressable><Text style={uploadScreen.title}>Upload bill</Text></View>{preferredTransactionId ? <View style={[uploadScreen.selector, { minHeight: 68, borderColor: '#5C70FF', borderWidth: 2 }]}><View style={{ flex: 1 }}><Text style={{ color: '#17223A', fontWeight: '800' }}>Bill for this transaction only</Text><Text numberOfLines={1} style={{ color: '#71809A', marginTop: 3 }}>{selectedTransaction?.merchant} · {money(selectedTransaction?.amount ?? 0)}</Text></View><Text style={{ color: '#5C70FF', fontWeight: '800' }}>✓</Text></View> : <><Text style={uploadScreen.label}>Select missing transaction</Text><View style={{ gap: 8 }}>{missing.map((item) => <Pressable key={item.id} onPress={() => { setTransactionId(item.id); setMessage(''); }} style={[uploadScreen.selector, { height: 64 }, transactionId === item.id && { borderColor: '#5C70FF', borderWidth: 2 }]}><View><Text numberOfLines={1} style={{ color: '#17223A', fontWeight: '800' }}>{item.merchant}</Text><Text style={{ color: '#71809A', marginTop: 3 }}>{item.postedLabel} · {money(item.amount)}</Text></View>{transactionId === item.id && <Text style={{ color: '#5C70FF', fontWeight: '800' }}>✓</Text>}</Pressable>)}</View></>}<Text style={[uploadScreen.label, { marginTop: 24 }]}>Upload new bill</Text><Pressable onPress={chooseFile} style={uploadScreen.dropzone}><View style={uploadScreen.camera}><Camera size={34} color="#6A758B" /></View><Text style={uploadScreen.dropTitle}>{file ? file.name : 'Browse files'}</Text><Text style={uploadScreen.dropSub}>{file ? 'Ready to match' : 'Choose a PDF or image · maximum 10 MB'}</Text>{file?.mimeType?.startsWith('image/') && <Image source={{ uri: file.uri }} style={{ width: 176, height: 120, marginTop: 12, borderRadius: 12 }} resizeMode="contain" />}</Pressable><View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}><Pressable onPress={() => onChooseMedia('camera')} style={[uploadScreen.selector, { height: 52, flex: 1, justifyContent: 'center' }]}><Text style={{ color: '#5C70FF', fontWeight: '800' }}>Take photo</Text></Pressable><Pressable onPress={() => onChooseMedia('gallery')} style={[uploadScreen.selector, { height: 52, flex: 1, justifyContent: 'center' }]}><Text style={{ color: '#5C70FF', fontWeight: '800' }}>Gallery</Text></Pressable></View><Text style={[uploadScreen.label, { marginTop: 24 }]}>Or select an uploaded bill</Text>{loadingBills ? <Text style={{ color: '#71809A', textAlign: 'center' }}>Loading bills…</Text> : availableBills.map((bill) => <Pressable key={bill.id} onPress={() => { setSelectedBillId(bill.id); setFile(null); setMessage(''); }} style={[uploadScreen.selector, { minHeight: 68, marginBottom: 8 }, selectedBillId === bill.id && { borderColor: '#5C70FF', borderWidth: 2 }]}><View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: '#17223A', fontWeight: '800' }}>{bill.fileName}</Text><Text style={{ color: '#71809A', marginTop: 3 }}>{Math.round(bill.fileSizeBytes / 1024)} KB · {bill.uploadedBy}</Text>{bill.mimeType.startsWith('image/') && <Image source={{ uri: billFileUrl(bill.id), headers: { Authorization: `Bearer ${token}` } }} style={{ width: 90, height: 56, marginTop: 8, borderRadius: 8 }} resizeMode="cover" />}</View>{selectedBillId === bill.id && <Text style={{ color: '#5C70FF', fontWeight: '800' }}>✓</Text>}</Pressable>)}{!loadingBills && !availableBills.length && <Text style={{ color: '#71809A', textAlign: 'center' }}>No unmatched bills available for this account.</Text>}{!!message && <Text style={{ color: message.includes('matched') ? '#159148' : '#D9363E', textAlign: 'center', fontWeight: '700', marginTop: 16 }}>{message}</Text>}<Pressable onPress={save} disabled={saving || (!file && !selectedBillId) || !transactionId} style={[uploadScreen.save, (!file && !selectedBillId || !transactionId || saving) && { backgroundColor: '#A7B1FA' }]}><Text style={uploadScreen.saveText}>{saving ? 'Saving…' : 'Save bill match'}</Text></Pressable></ScrollView></View>;
}

function StandaloneUploadPage({ token, workspace, selectedBankId, onUploaded }: { token: string; workspace: Workspace | null; selectedBankId: string | null; onUploaded: () => Promise<void> }) {
  const [file, setFile] = useState<{ uri: string; name: string; mimeType?: string | null } | null>(null); const [saving, setSaving] = useState(false); const [message, setMessage] = useState('');
  const business = workspace?.activeBusiness; const account = workspace?.bankAccounts.find((item) => item.id === selectedBankId) ?? workspace?.bankAccounts[0];
  const choose = async (source: 'camera' | 'gallery' | 'file') => { try { if (source === 'file') { const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true }); if (!result.canceled) { const asset = result.assets[0]; setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType }); } return; } const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) { setMessage(`Allow ${source === 'camera' ? 'camera' : 'photo library'} access to upload a bill.`); return; } const result = source === 'camera' ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: .85 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: .85 }); if (!result.canceled) { const asset = result.assets[0]; setFile({ uri: asset.uri, name: asset.fileName ?? `bill-${Date.now()}.jpg`, mimeType: asset.mimeType ?? 'image/jpeg' }); } } catch { setMessage('Unable to choose the bill.'); } };
  const save = async () => { if (!business || !account) { setMessage('Select a business and bank account on Home first.'); return; } if (!file) { setMessage('Take a photo or choose a bill first.'); return; } setSaving(true); setMessage(''); try { await uploadStandaloneBill(token, { businessId: business.id, bankAccountId: account.id, file }); await onUploaded(); setFile(null); setMessage('Bill uploaded successfully for this business and account.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to upload the bill.'); } finally { setSaving(false); } };
  return <ScrollView contentContainerStyle={uploadScreen.screen}><View style={uploadScreen.header}><Text style={uploadScreen.title}>Upload bill</Text></View><Text style={uploadScreen.label}>Business</Text><View style={uploadScreen.selector}><Building2 size={21} color="#5C70FF"/><Text style={{ flex: 1, fontWeight: '800', color: '#17223A' }}>{business?.name ?? 'No business selected'}</Text></View><Text style={[uploadScreen.label, { marginTop: 18 }]}>Bank account</Text><View style={uploadScreen.selector}><Building2 size={21} color="#5C70FF"/><Text style={{ flex: 1, fontWeight: '800', color: '#17223A' }}>{account ? `${account.name} ${account.maskedNumber}` : 'No account selected'}</Text></View><Text style={[uploadScreen.label, { marginTop: 24 }]}>Upload bill</Text><View style={uploadScreen.dropzone}><View style={uploadScreen.camera}><Camera size={34} color="#6A758B" /></View><Text style={uploadScreen.dropTitle}>{file ? file.name : 'Tap an option to upload or capture a bill'}</Text><Text style={uploadScreen.dropSub}>{file ? 'Ready to save' : 'Select from gallery, camera, or files'}</Text>{file?.mimeType?.startsWith('image/') && <Image source={{ uri: file.uri }} style={{ width: 200, height: 140, marginTop: 12, borderRadius: 12 }} resizeMode="contain" />}</View><View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}><Pressable onPress={() => void choose('gallery')} style={[uploadScreen.selector, { height: 52, flex: 1, justifyContent: 'center' }]}><Text style={{ color: '#5C70FF', fontWeight: '800' }}>Gallery</Text></Pressable><Pressable onPress={() => void choose('camera')} style={[uploadScreen.selector, { height: 52, flex: 1, justifyContent: 'center' }]}><Text style={{ color: '#5C70FF', fontWeight: '800' }}>Take photo</Text></Pressable></View><Pressable onPress={() => void choose('file')} style={[uploadScreen.selector, { height: 52, justifyContent: 'center', marginTop: 10 }]}><Text style={{ color: '#5C70FF', fontWeight: '800' }}>Browse files</Text></Pressable>{!!message && <Text style={{ color: /success/i.test(message) ? '#159148' : '#D9363E', textAlign: 'center', fontWeight: '700', marginTop: 16 }}>{message}</Text>}<Pressable onPress={save} disabled={saving || !file || !business || !account} style={[uploadScreen.save, (saving || !file || !business || !account) && { backgroundColor: '#A7B1FA' }]}><Text style={uploadScreen.saveText}>{saving ? 'Saving…' : 'Save'}</Text></Pressable></ScrollView>;
}
function PickerSheet({title,items,choose,close}:{title:string,items:string[][],choose:(x:string)=>void,close:()=>void}){return <View style={s.overlay}><Pressable style={s.overlayTap} onPress={close}/><SlideUpSheet style={detail.sheet}><View style={s.handle}/><View style={detail.sheetHead}><Text style={detail.sheetTitle}>{title}</Text><Pressable style={s.close} onPress={close}><Text style={s.closeText}>×</Text></Pressable></View>{items.map(([name,sub])=><Pressable key={name} onPress={()=>choose(name)} style={detail.sheetRow}><Text style={detail.sheetName}>{name}</Text><Text style={detail.sheetSub}>{sub}</Text></Pressable>)}</SlideUpSheet></View>}
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

function AllTransactions({ transactions, onDetails, onAdd }: { transactions: FinanceTransaction[]; onDetails: (id: string) => void; onAdd: () => void }) {
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState(false);
  const [query, setQuery] = useState("");
  const shown = transactions.filter((item) =>
    item.merchant.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <View style={{ flex: 1, backgroundColor: "#F4F6FA" }}>
      <ScrollView contentContainerStyle={transactionUi.screen}>
        {searching ? (
          <View style={transactionUi.searchRow}>
            <View style={transactionUi.searchField}>
              <Search size={21} color="#97A3B9" />
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="Search"
                placeholderTextColor="#9AA6BD"
                style={transactionUi.searchInput}
              />
            </View>
            <Pressable
              onPress={() => setFilter(true)}
              style={transactionUi.tool}
            >
              <CalendarDays size={23} color="#17223A" />
            </Pressable>
            <Pressable
              onPress={() => {
                setSearching(false);
                setQuery("");
              }}
              style={[transactionUi.tool, transactionUi.searchTool]}
            >
              <Text style={transactionUi.clear}>×</Text>
            </Pressable>
          </View>
        ) : (
            <View style={transactionUi.titleRow}>
            <View><Text style={transactionUi.title}>Transactions</Text><Text style={transactionUi.titleHint}>Tap a transaction to edit or add a bill</Text></View>
            <View style={{ flexDirection: 'row', gap: 8 }}><Pressable onPress={onAdd} style={[transactionUi.tool, { width: 42 }]}><Text style={{ fontSize: 24, color: '#5C70FF' }}>＋</Text></Pressable><Pressable onPress={() => setSearching(true)} style={transactionUi.tool}><Search size={25} color="#17223A" /></Pressable></View>
          </View>
        )}
        {shown.map((item) => {
          const hasBill = item.billStatus === 'attached';
          return <Pressable onPress={() => onDetails(item.id)} key={item.id} style={transactionUi.card}>
            <View style={[transactionUi.billIcon, !hasBill && transactionUi.missingBill]}>
              {hasBill ? <><ReceiptText size={25} color="#FFF" /><View style={transactionUi.check}><Text style={transactionUi.checkText}>✓</Text></View></> : <Text style={transactionUi.plus}>＋</Text>}
            </View>
            <View style={transactionUi.cardInfo}><Text numberOfLines={1} style={transactionUi.name}>{item.merchant}</Text><Text style={transactionUi.meta}>{item.postedLabel} · {item.category}</Text></View>
            <View style={transactionUi.amountArea}>
              <Text style={transactionUi.amount}>{money(item.amount)}</Text>
              <View style={[transactionUi.billBadge, hasBill ? transactionUi.billBadgeAttached : transactionUi.billBadgeMissing]}>
                {hasBill ? <Text style={transactionUi.billBadgeCheck}>✓</Text> : <Upload size={12} color="#E13B48" strokeWidth={2.5} />}
                <Text style={[transactionUi.billBadgeText, hasBill ? transactionUi.billBadgeAttachedText : transactionUi.billBadgeMissingText]}>{hasBill ? "Bill attached" : "Add bill"}</Text>
              </View>
            </View>
          </Pressable>;
        })}
        {!shown.length && <Text style={{ color: '#71809A', textAlign: 'center', marginTop: 28 }}>No transactions found.</Text>}
      </ScrollView>
      {filter && <DateFilter onClose={() => setFilter(false)} />}
    </View>
  );
}
function DateFilter({ onClose }: { onClose: () => void }) {
  const [picker, setPicker] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const formatDate = (date?: Date) => date ? date.toLocaleDateString("en-GB").replace(/\//g, "-") : "dd-mm-yyyy";
  return (
    <View style={transactionUi.overlay}>
      <Pressable onPress={onClose} style={transactionUi.overlayTap} />
      <SlideUpSheet style={transactionUi.filterSheet}>
        <View style={transactionUi.handle} />
        <View style={transactionUi.filterHead}>
          <Text style={transactionUi.filterTitle}>Filter by date</Text>
          <Pressable onPress={onClose} style={transactionUi.close}>
            <Text style={transactionUi.closeText}>×</Text>
          </Pressable>
        </View>
        <View style={transactionUi.filterTabs}>
          {["Week", "Month", "Last month", "30 days"].map((x, i) => (
            <Pressable
              key={x}
              style={[
                transactionUi.filterTab,
                i === 1 && transactionUi.filterTabOn,
              ]}
            >
              <Text style={transactionUi.filterTabText}>{x}</Text>
            </Pressable>
          ))}
        </View>
        <View style={transactionUi.divider}>
          <View style={transactionUi.dividerLine} />
          <Text style={transactionUi.dividerText}>CUSTOM RANGE</Text>
          <View style={transactionUi.dividerLine} />
        </View>
        <View style={transactionUi.dateInputs}>
          <Pressable
            onPress={() => setPicker("from")}
            style={transactionUi.dateInput}
          >
            <Text style={transactionUi.dateLabel}>FROM</Text>
            <Text style={transactionUi.dateValue}>{formatDate(fromDate)}</Text>
          </Pressable>
          <Text style={transactionUi.arrow}>→</Text>
          <Pressable
            onPress={() => setPicker("to")}
            style={transactionUi.dateInput}
          >
            <Text style={transactionUi.dateLabel}>TO</Text>
            <Text style={transactionUi.dateValue}>{formatDate(toDate)}</Text>
          </Pressable>
        </View>
        <View style={transactionUi.filterActions}>
          <Text style={transactionUi.reset}>Reset</Text>
          <Pressable onPress={onClose} style={transactionUi.apply}>
            <Text style={transactionUi.applyText}>Apply</Text>
          </Pressable>
        </View>
        {!!picker && <DateTimePicker value={picker === "from" ? (fromDate || new Date()) : (toDate || new Date())} mode="date" display="calendar" onChange={(_, date) => { setPicker(""); if (date) picker === "from" ? setFromDate(date) : setToDate(date); }} />}
      </SlideUpSheet>
    </View>
  );
}

function MarqueeName({ text }: { text: string }) {
  const translate = useRef(new Animated.Value(0)).current;
  const long = text.length > 23;
  useEffect(() => {
    if (!long) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(translate, {
          toValue: -92,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.delay(900),
        Animated.timing(translate, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.delay(700),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [long, translate]);
  return (
    <View style={listUi.nameClip}>
      <Animated.Text
        numberOfLines={1}
        style={[
          listUi.name,
          { transform: [{ translateX: long ? translate : 0 }] },
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
}
function Bills({ transactions }: { transactions: FinanceTransaction[] }) {
  const [attached, setAttached] = useState(false);
  const missing = transactions.filter((transaction) => transaction.billStatus === 'missing');
  const attachedBills = transactions.filter((transaction) => transaction.billStatus === 'attached');
  const shown = attached ? attachedBills : missing;
  return (
    <View style={{ flex: 1, backgroundColor: "#F4F6FA" }}>
      <View style={listUi.billsHeader}>
        <View style={listUi.pageTitleRow}>
          <View><Text style={listUi.pageTitle}>Bills</Text><Text style={listUi.pageSubtitle}>{missing.length} of {transactions.length} transactions need a bill</Text></View>
        </View>
        <View style={listUi.tabs}>
          <Pressable
            onPress={() => setAttached(false)}
            style={[listUi.tab, !attached && listUi.tabActive]}
          >
            <Text style={[listUi.tabText, !attached && listUi.tabTextActive]}>
              Missing  <Text style={listUi.tabCountMissing}>{missing.length}</Text>
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setAttached(true)}
            style={[listUi.tab, attached && listUi.tabActive]}
          >
            <Text style={[listUi.tabText, attached && listUi.tabTextActive]}>
              Attached  <Text style={listUi.tabCountAttached}>{attachedBills.length}</Text>
            </Text>
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: 120 }}>
          {shown.map((transaction) => {
            return <View key={transaction.id} style={listUi.billCard}>
              <View style={[listUi.billTile, !attached && listUi.billTileMissing]}>{attached ? <><ReceiptText size={25} color="#FFF" /><View style={listUi.billCheck}><Text style={listUi.billCheckText}>✓</Text></View></> : <Text style={listUi.billPlus}>＋</Text>}</View>
              <View style={listUi.billInfo}><MarqueeName text={transaction.merchant} /><Text style={listUi.meta}>{transaction.postedLabel} · {transaction.category}</Text></View>
              <View style={listUi.billAmountArea}><Text style={listUi.amount}>{money(transaction.amount)}</Text><View style={[listUi.statusBadge, attached ? listUi.statusAttached : listUi.statusMissing]}><Text style={[listUi.statusBadgeText, attached ? listUi.statusAttachedText : listUi.statusMissingText]}>{attached ? "✓  Bill attached" : "⇧  Add bill"}</Text></View></View>
            </View>;
          })}
          {!shown.length && <Text style={{ color: '#71809A', textAlign: 'center', marginTop: 28 }}>No {attached ? 'attached' : 'missing'} bills.</Text>}
      </ScrollView>
    </View>
  );
}
const transactionUi = StyleSheet.create({
  screen: { padding: 16, paddingTop: 18, paddingBottom: 112 },
  titleRow: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 25, fontWeight: "800", color: "#17223A" },
  titleHint: { fontSize: 14, color: "#8290A8", marginTop: 3 },
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
  searchRow: { height: 66, flexDirection: "row", gap: 12, marginBottom: 20 },
  searchField: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0E5EF",
    backgroundColor: "#FFF",
    paddingHorizontal: 17,
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  searchHint: { fontSize: 17, color: "#9AA6BD" },
  searchTool: { borderColor: "#5C70FF", backgroundColor: "#F6F7FF" },
  card: {
    height: 84,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E1E6EF",
    backgroundColor: "#FFF",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  billIcon: {
    height: 50,
    width: 48,
    borderRadius: 15,
    backgroundColor: "#14203B",
    borderWidth: 1,
    borderColor: "#E1E6EF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  missingBill: {
    backgroundColor: "#F7F8FF",
    borderStyle: "dashed",
    borderColor: "#B9C4FF",
  },
  plus: { fontSize: 23, color: "#7B89A6" },
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
  cardInfo: { flex: 1, minWidth: 0, height: 46, marginLeft: 13, marginRight: 8, justifyContent: "flex-start" },
  name: { fontSize: 16, lineHeight: 20, fontWeight: "700", color: "#1D2840" },
  meta: { fontSize: 14, lineHeight: 17, color: "#8290A8", marginTop: 3 },
  amount: { fontSize: 16, lineHeight: 20, fontWeight: "700", color: "#17223A" },
  amountArea: { height: 46, alignItems: "flex-end", justifyContent: "flex-start", gap: 5, flexShrink: 0 },
  billBadge: { height: 24, borderRadius: 12, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 4 },
  billBadgeAttached: { backgroundColor: "#EAF6EF" },
  billBadgeMissing: { backgroundColor: "#FDEBEC" },
  billBadgeText: { fontSize: 11, fontWeight: "700" },
  billBadgeAttachedText: { color: "#159148" },
  billBadgeMissingText: { color: "#E13B48" },
  billBadgeCheck: { fontSize: 12, color: "#159148", fontWeight: "800" },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(20,30,50,.38)",
    justifyContent: "flex-end",
  },
  overlayTap: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
  filterSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    padding: 26,
    paddingBottom: 43,
  },
  handle: {
    height: 5,
    width: 64,
    borderRadius: 4,
    backgroundColor: "#E3E7F0",
    alignSelf: "center",
    marginBottom: 20,
  },
  filterHead: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  filterTitle: { fontSize: 27, fontWeight: "700", color: "#17223A" },
  close: {
    height: 48,
    width: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E5EF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  closeText: { fontSize: 27, color: "#17223A" },
  filterTabs: {
    height: 70,
    borderRadius: 20,
    backgroundColor: "#F1F3F8",
    padding: 5,
    flexDirection: "row",
  },
  filterTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  filterTabOn: { backgroundColor: "#FFF" },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6D7990",
    textAlign: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 28,
  },
  dividerLine: { height: 1, backgroundColor: "#E0E5EF", flex: 1 },
  dividerText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#94A0B8",
  },
  dateInputs: {
    height: 92,
    borderRadius: 20,
    backgroundColor: "#F3F5FA",
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateInput: {
    flex: 1,
    height: 74,
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E1E6EF",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#98A4BA",
  },
  dateValue: {
    fontSize: 17,
    fontWeight: "600",
    color: "#17223A",
    marginTop: 6,
  },
  arrow: { fontSize: 24, color: "#95A1B8" },
  filterActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
  },
  reset: { fontSize: 16, fontWeight: "600", color: "#6D7990" },
  apply: {
    height: 64,
    width: 145,
    borderRadius: 19,
    backgroundColor: "#A7B1FA",
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  searchInput: { flex: 1, fontSize: 17, color: "#17223A", padding: 0 },
  clear: { fontSize: 30, color: "#5C70FF", fontWeight: "300", marginTop: -4 },
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
function AnalyticsHeader({ title, onBack, onFilter }: { title: string; onBack: () => void; onFilter: () => void }) {
  return <View style={analytics.header}><Pressable onPress={onBack} style={analytics.headerButton}><Text style={analytics.back}>‹</Text></Pressable><Text style={analytics.title}>{title}</Text><Pressable onPress={onFilter} style={[analytics.headerButton, analytics.filterButton]}><SlidersHorizontal size={24} color="#17223A" /></Pressable></View>;
}

function RangeSheet({ selected, onChoose, onClose }: { selected: 'This month' | 'Last month' | 'This quarter' | 'Year to date'; onChoose: (period: 'This month' | 'Last month' | 'This quarter' | 'Year to date') => void; onClose: () => void }) {
  const periods: Array<'This month' | 'Last month' | 'This quarter' | 'Year to date'> = ['This month', 'Last month', 'This quarter', 'Year to date'];
  return <View style={analytics.overlay}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} /><SlideUpSheet style={analytics.rangeSheet}><View style={analytics.sheetHandle} /><View style={analytics.sheetHead}><Text style={analytics.sheetTitle}>Select date range</Text><Pressable onPress={onClose} style={analytics.close}><Text style={analytics.closeText}>×</Text></Pressable></View>{periods.map((period) => <Pressable key={period} onPress={() => { onChoose(period); onClose(); }} style={[analytics.rangeTab, { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 }, selected === period && analytics.rangeTabActive]}><Text style={selected === period ? analytics.rangeTabActiveText : analytics.rangeTabText}>{period}</Text>{selected === period && <Text style={analytics.rangeTabActiveText}>✓</Text>}</Pressable>)}</SlideUpSheet></View>;
}

function Charts({ workspace, selectedBankId, selectedPeriod, onBack }: { workspace: Workspace | null; selectedBankId: string | null; selectedPeriod: 'This month' | 'Last month' | 'This quarter' | 'Year to date'; onBack: () => void }) {
  const [rangeOpen, setRangeOpen] = useState(false); const [range, setRange] = useState(selectedPeriod);
  const transactions = transactionsForPeriod((workspace?.transactions ?? []).filter((item) => !selectedBankId || item.bankAccountId === selectedBankId), range);
  const categories = Object.entries(transactions.reduce<Record<string, number>>((result, item) => { result[item.category || 'Uncategorized'] = (result[item.category || 'Uncategorized'] ?? 0) + Math.abs(numberValue(item.amount)); return result; }, {})).map(([name, amount]) => ({ name, amount }));
  const months = workspace?.charts.months ?? [];
  const total = categories.reduce((sum, item) => sum + numberValue(item.amount), 0) || 1;
  const maxMonth = Math.max(...months.map((item) => numberValue(item.amount)), 1);
  return <View style={analytics.page}><ScrollView contentContainerStyle={analytics.screen}><AnalyticsHeader title="Charts" onBack={onBack} onFilter={() => setRangeOpen(true)} /><Text style={{ color: '#71809A', fontWeight: '700', marginBottom: 10 }}>{range} · {transactions.length} transactions</Text><View style={analytics.card}><Text style={analytics.eyebrow}>Spending by category</Text><View style={analytics.totalLine}><Text style={analytics.total}>{money(transactionSummary(transactions).spent)}</Text><Text style={analytics.categoryCount}>{categories.length} categories</Text></View>{categories.map((item) => <View key={item.name} style={analytics.categoryRow}><View style={analytics.categoryTextRow}><Text style={analytics.categoryName}>{item.name}</Text><Text style={analytics.categoryAmount}>{money(item.amount)}</Text></View><View style={analytics.track}><View style={[analytics.fill, { width: `${Math.max(2, numberValue(item.amount) / total * 100)}%` }]} /></View></View>)}</View><View style={[analytics.card, analytics.monthCard]}><Text style={analytics.eyebrow}>Monthly spending</Text><View style={analytics.monthTotalRow}><Text style={analytics.total}>{money(transactionSummary(transactions).spent)}</Text><Text style={analytics.average}>total in selected range</Text></View><View style={analytics.bars}>{months.map((item, i) => <View style={analytics.barColumn} key={item.month}><Text style={analytics.barValue}>{money(item.amount)}</Text><View style={analytics.barWrap}><View style={[analytics.bar, { height: Math.max(18, numberValue(item.amount) / maxMonth * 198), backgroundColor: i === months.length - 1 ? "#C9D0E6" : "#304394" }]} /></View><Text style={analytics.barMonth}>{item.month}</Text></View>)}</View></View></ScrollView>{rangeOpen && <RangeSheet selected={range} onChoose={setRange} onClose={() => setRangeOpen(false)} />}</View>;
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
function Reports({ workspace, selectedBankId, selectedPeriod, onBack }: { workspace: Workspace | null; selectedBankId: string | null; selectedPeriod: 'This month' | 'Last month' | 'This quarter' | 'Year to date'; onBack: () => void }) {
  const [rangeOpen, setRangeOpen] = useState(false); const [range, setRange] = useState(selectedPeriod);
  const bank = workspace?.bankAccounts.find((account) => account.id === selectedBankId) ?? workspace?.bankAccounts[0]; const report = transactionSummary(transactionsForPeriod((workspace?.transactions ?? []).filter((item) => !selectedBankId || item.bankAccountId === selectedBankId), range));
  return <View style={analytics.page}><ScrollView contentContainerStyle={analytics.screen}><AnalyticsHeader title="Reports" onBack={onBack} onFilter={() => setRangeOpen(true)} /><View style={analytics.selectors}><View style={analytics.selector}><Text style={analytics.selectorLabel}>BUSINESS</Text><View style={analytics.selectorValue}><Building2 size={20} color="#71809A"/><Text style={analytics.selectorText}>{workspace?.activeBusiness?.name ?? 'No business'}</Text></View></View><View style={analytics.selector}><Text style={analytics.selectorLabel}>BANK ACCOUNT</Text><View style={analytics.selectorValue}><Building2 size={20} color="#71809A"/><Text style={analytics.selectorText}>{bank ? `${bank.name} ${bank.maskedNumber}` : 'No bank account'}</Text></View></View></View><LinearGradient colors={["#121B35", "#12203B", "#33449A"]} start={{x:0,y:0}} end={{x:1,y:1}} style={analytics.reportSummary}><View style={analytics.summaryDate}><CalendarDays size={19} color="#B3BED7"/><Text style={analytics.summaryDateText}>{range}</Text></View><Text style={analytics.reportAmount}>{money(report.spent)}</Text><Text style={analytics.reportCaption}>Total spending · {bank?.maskedNumber ?? 'No account'}</Text><View style={analytics.summaryDivider}/><View style={analytics.summaryStats}><View style={analytics.summaryStat}><Text style={analytics.summaryLabel}>Transactions</Text><Text style={analytics.summaryValue}>{report.transactionCount}</Text></View><View style={analytics.summaryStat}><Text style={analytics.summaryLabel}>GST claimable</Text><Text style={analytics.summaryValue}>{money(report.gstClaimable)}</Text></View><View style={analytics.summaryStat}><Text style={analytics.summaryLabel}>Bills missing</Text><Text style={[analytics.summaryValue,{color:"#FFA7B0"}]}>{report.billsMissing}</Text></View></View></LinearGradient><View style={analytics.exportCard}><View style={analytics.exportTop}><View style={analytics.exportIcon}><FileText size={26} color="#5C70FF"/></View><View style={{flex:1}}><Text style={analytics.exportTitle}>Transactions report</Text><Text style={analytics.exportHint}>Date, remarks, amount, category, GST, PST, bill status</Text></View></View></View></ScrollView>{rangeOpen && <RangeSheet selected={range} onChoose={setRange} onClose={() => setRangeOpen(false)} />}</View>;
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
  selectorText: { flex: 1, minWidth: 0, color: "#17223A", fontSize: 15, fontWeight: "700" },
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
  exportButton: { height: 60, borderRadius: 18, backgroundColor: "#5C70FF", marginTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  exportButtonText: { color: "#FFF", fontSize: 17, fontWeight: "800" },
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(20,30,50,.38)", justifyContent: "flex-end", zIndex: 4 },
  rangeSheet: { backgroundColor: "#FFF", borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 22 },
  sheetHandle: { alignSelf: "center", width: 60, height: 5, borderRadius: 3, backgroundColor: "#E2E6EF", marginBottom: 14 },
  sheetHead: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  sheetTitle: { color: "#101A32", fontSize: 22, fontWeight: "800" },
  close: { marginLeft: "auto", height: 42, width: 42, borderRadius: 14, borderWidth: 1, borderColor: "#E0E5EF", alignItems: "center", justifyContent: "center" },
  closeText: { color: "#17223A", fontSize: 27, fontWeight: "400", marginTop: -2 },
  rangeTabs: { height: 60, borderRadius: 18, padding: 5, backgroundColor: "#F1F3F8", flexDirection: "row" },
  rangeTab: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  rangeTabActive: { backgroundColor: "#121B34" },
  rangeTabText: { color: "#71809A", fontSize: 15, fontWeight: "700" },
  rangeTabActiveText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#DFE4EE" },
  dividerText: { color: "#94A0B8", fontSize: 13, fontWeight: "800", letterSpacing: 1.2 },
  dateBox: { height: 76, padding: 6, borderRadius: 18, backgroundColor: "#F3F5FA", flexDirection: "row", alignItems: "center", gap: 8 },
  dateInput: { flex: 1, height: 64, borderRadius: 14, borderWidth: 1, borderColor: "#BFC8FF", backgroundColor: "#FFF", paddingHorizontal: 14, justifyContent: "center" },
  dateLabel: { color: "#98A4BA", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  dateValue: { color: "#101A32", fontSize: 16, fontWeight: "800", marginTop: 3 },
  calendarIcon: { position: "absolute", right: 13, bottom: 14 },
  dateArrow: { color: "#94A0B8", fontSize: 26 },
  sheetActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20 },
  reset: { color: "#71809A", fontSize: 16, fontWeight: "700" },
  showButton: { height: 60, paddingHorizontal: 24, borderRadius: 18, backgroundColor: "#5C70FF", justifyContent: "center", alignItems: "center" },
  showText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});

function DetailPageHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: any }) {
  return <View style={pageUi.header}><Pressable onPress={onBack} style={pageUi.back}><Text style={pageUi.backText}>‹</Text></Pressable><Text style={pageUi.title}>{title}</Text>{action ? <View style={{ marginLeft: "auto" }}>{action}</View> : null}</View>;
}

function ProfilePage({ token, user, onUpdated, onBack }: { token: string; user: AuthSession['user'] | null; onUpdated: (user: AuthSession['user']) => void; onBack: () => void }) {
  const [name, setName] = useState(user?.name ?? ''); const [phone, setPhone] = useState(''); const [saving, setSaving] = useState(false);
  useEffect(() => setName(user?.name ?? ''), [user?.name]);
  const save = async () => { if (!token) return; setSaving(true); try { const result = await updateProfile(token, { name, phone }); onUpdated(result.user); } finally { setSaving(false); } };
  const role = user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : 'User';
  return <ScrollView contentContainerStyle={pageUi.screen}><DetailPageHeader title="Profile" onBack={onBack} /><View style={pageUi.profileCard}><View style={pageUi.profileIcon}><UserRound size={32} color="#20336D" /></View><View style={{ flex: 1 }}><Text style={pageUi.profileName}>{user?.name ?? 'Loading…'}</Text><Text style={pageUi.profileEmail}>{user?.email ?? ''}</Text></View><Text style={pageUi.staff}>{role}</Text></View><View style={pageUi.formCard}><View><Text style={pageUi.formLabel}>Full name</Text><TextInput value={name} onChangeText={setName} style={pageUi.formInput}/></View><View style={pageUi.formFieldSpaced}><Text style={pageUi.formLabel}>Email</Text><TextInput value={user?.email ?? ''} editable={false} style={[pageUi.formInput, pageUi.formInputDisabled]}/></View><View style={pageUi.formFieldSpaced}><Text style={pageUi.formLabel}>Phone</Text><TextInput value={phone} onChangeText={setPhone} placeholder="Add phone number" style={pageUi.formInput}/></View></View><Pressable onPress={save} disabled={saving} style={[pageUi.save, saving && { opacity: .55 }]}><Text style={pageUi.saveText}>{saving ? 'Saving…' : 'Save'}</Text></Pressable></ScrollView>;
}

function BusinessesPage({ workspace, onBack, onAdd }: { workspace: Workspace | null; onBack: () => void; onAdd: () => void }) {
  const businessList = workspace?.businesses ?? [];
  const activeBusiness = workspace?.activeBusiness;
  const accounts = workspace?.bankAccounts ?? [];
  return <ScrollView contentContainerStyle={pageUi.screen}><DetailPageHeader title="Businesses" onBack={onBack} action={<Pressable onPress={onAdd} style={pageUi.add}><Text style={pageUi.addText}>＋  Add business</Text></Pressable>} />{businessList.map((business) => { const isActive = business.id === activeBusiness?.id; const initials = business.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase(); return <View style={pageUi.businessCard} key={business.id}><View style={pageUi.businessHead}><View style={pageUi.initials}><Text style={pageUi.initialsText}>{initials}</Text></View><View style={{ flex: 1 }}><Text style={pageUi.profileName}>{business.name}</Text><Text style={pageUi.profileEmail}>{isActive ? `${accounts.length} institution${accounts.length === 1 ? '' : 's'}` : 'Select from Home to view institutions'}</Text></View>{isActive && <View style={pageUi.active}><Text style={pageUi.activeText}>● Active</Text></View>}</View>{isActive && accounts.length > 0 && <><View style={pageUi.cardDivider}/>{accounts.map((account) => <View style={pageUi.accountRow} key={account.id}><View style={pageUi.accountIcon}><Building2 size={25} color="#FFF" /></View><View style={{ flex: 1 }}><Text style={pageUi.accountName}>{account.name}</Text><Text style={pageUi.accountNumber}>{account.maskedNumber}</Text></View><View style={{ alignItems: "flex-end" }}><Text style={pageUi.accountBalance}>{money(account.balance)}</Text><Text style={pageUi.balanceLabel}>Balance</Text></View></View>)}</>}</View>; })}{!businessList.length && <Text style={{ textAlign: 'center', color: '#71809A', marginTop: 36 }}>No businesses yet.</Text>}</ScrollView>;
}

function AddInstitution({ token, business, onBack, onSaved }: { token: string; business: AuthSession['businesses'][number] | null; onBack: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(''); const [accountNumber, setAccountNumber] = useState(''); const [accountType, setAccountType] = useState('Chequing Account'); const [saving, setSaving] = useState(false); const [message, setMessage] = useState('');
  const save = async () => { if (!business || !name.trim() || !accountNumber.trim()) { setMessage('Enter the institution name and account number.'); return; } setSaving(true); setMessage(''); try { await createBankAccount(token, business.id, { name: name.trim(), accountNumber: accountNumber.trim(), accountType }); await onSaved(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to add the institution.'); } finally { setSaving(false); } };
  return <ScrollView contentContainerStyle={pageUi.screen}><DetailPageHeader title="Add institution" onBack={onBack} /><View style={pageUi.formCard}><Text style={pageUi.formLabel}>Business</Text><Text style={[pageUi.formInput, { paddingTop: 15, color: '#71809A' }]}>{business?.name ?? 'No business selected'}</Text><Text style={[pageUi.formLabel, pageUi.formFieldSpaced]}>Institution name *</Text><TextInput value={name} onChangeText={setName} placeholder="e.g. CIBC" style={pageUi.formInput}/><Text style={[pageUi.formLabel, pageUi.formFieldSpaced]}>Account number *</Text><TextInput value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" placeholder="Account number" style={pageUi.formInput}/><Text style={[pageUi.formLabel, pageUi.formFieldSpaced]}>Account type</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Chequing Account','Savings Account','Credit Card','Business Account'].map((type) => <Pressable key={type} onPress={() => setAccountType(type)} style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: accountType === type ? '#EAF0FF' : '#F2F4F8' }}><Text style={{ color: accountType === type ? '#2463EB' : '#66748F', fontWeight: '700', fontSize: 12 }}>{type.replace(' Account','')}</Text></Pressable>)}</View></View>{!!message && <Text style={{ color: '#D9363E', textAlign: 'center', marginTop: 14 }}>{message}</Text>}<Pressable onPress={save} disabled={saving} style={[pageUi.save, saving && { opacity: .55 }]}><Text style={pageUi.saveText}>{saving ? 'Saving…' : 'Save institution'}</Text></Pressable></ScrollView>;
}

const pageUi = StyleSheet.create({
  screen: { padding: 16, paddingTop: 18, paddingBottom: 126, backgroundColor: "#F4F6FA", flexGrow: 1 }, header: { height: 62, flexDirection: "row", alignItems: "center", marginBottom: 16 }, back: { height: 48, width: 48, borderRadius: 15, borderWidth: 1, borderColor: "#E0E5EF", backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" }, backText: { fontSize: 30, color: "#253049", marginTop: -4 }, title: { color: "#101A32", fontSize: 27, fontWeight: "800", marginLeft: 16 }, profileCard: { minHeight: 126, padding: 22, borderRadius: 25, borderWidth: 1, borderColor: "#E2E6EF", backgroundColor: "#FFF", flexDirection: "row", alignItems: "center", marginBottom: 20 }, profileIcon: { height: 78, width: 78, borderRadius: 25, backgroundColor: "#EEF0FF", alignItems: "center", justifyContent: "center", marginRight: 20 }, profileName: { color: "#101A32", fontSize: 18, fontWeight: "800" }, profileEmail: { color: "#71809A", fontSize: 15, marginTop: 4 }, staff: { color: "#5C70FF", backgroundColor: "#EEF0FF", borderRadius: 15, paddingHorizontal: 13, paddingVertical: 6, fontSize: 14, fontWeight: "700" }, formCard: { borderRadius: 25, borderWidth: 1, borderColor: "#E2E6EF", backgroundColor: "#FFF", padding: 22 }, formLabel: { color: "#101A32", fontSize: 15, fontWeight: "600", marginBottom: 10 }, formFieldSpaced: { marginTop: 20 }, formInput: { height: 64, borderRadius: 18, borderWidth: 1, borderColor: "#E0E5EF", paddingHorizontal: 18, fontSize: 17, color: "#17223A" }, formInputDisabled: { backgroundColor: "#F7F8FC", color: "#71809A" }, save: { height: 76, borderRadius: 21, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center", marginTop: 22 }, saveText: { color: "#FFF", fontSize: 20, fontWeight: "800" }, add: { height: 54, borderRadius: 17, paddingHorizontal: 16, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center" }, addText: { color: "#FFF", fontSize: 16, fontWeight: "800" }, businessCard: { borderRadius: 25, borderWidth: 1, borderColor: "#E2E6EF", backgroundColor: "#FFF", padding: 24 }, businessHead: { flexDirection: "row", alignItems: "center" }, initials: { height: 68, width: 68, borderRadius: 20, backgroundColor: "#5C70FF", alignItems: "center", justifyContent: "center", marginRight: 16 }, initialsText: { color: "#FFF", fontSize: 22, fontWeight: "800" }, active: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#EAF6EF" }, activeText: { color: "#159148", fontSize: 13, fontWeight: "700" }, cardDivider: { height: 1, backgroundColor: "#E9EDF3", marginVertical: 20 }, accountRow: { minHeight: 96, borderRadius: 20, borderWidth: 1, borderColor: "#E1E6EF", padding: 14, flexDirection: "row", alignItems: "center", marginTop: 12 }, accountIcon: { height: 60, width: 60, borderRadius: 17, backgroundColor: "#121B34", alignItems: "center", justifyContent: "center", marginRight: 16 }, accountName: { color: "#101A32", fontSize: 16, fontWeight: "800" }, accountNumber: { color: "#8A96AC", fontSize: 14, marginTop: 4 }, accountBalance: { color: "#101A32", fontSize: 16, fontWeight: "800" }, balanceLabel: { color: "#8A96AC", fontSize: 13, marginTop: 4 },
});
function Team({ onBack, onAdd, token }: { token: string; onBack: () => void; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadError, setLoadError] = useState("");
  useEffect(() => { void getUsers(token).then((result) => setUsers(result.users)).catch((error) => setLoadError(error instanceof Error ? error.message : 'Unable to load users.')); }, [token]);
  const people = users.map((user) => [user.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase(), user.name, user.role[0].toUpperCase() + user.role.slice(1), user.email, user.businesses.length ? user.businesses.map((business) => business.name).join(', ') : 'No business access']);
  return (
    <ScrollView contentContainerStyle={team.screen}>
      <View style={team.header}>
        <Pressable onPress={onBack} style={team.back}>
          <Text style={team.backText}>‹</Text>
        </Pressable>
        <Text style={team.title}>Team</Text>
      </View>
      <Pressable onPress={onAdd} style={team.add}>
        <UsersRound size={21} color="#5C70FF" />
        <Text style={team.addText}>Add user</Text>
      </Pressable>
      {!!loadError && <Text style={{ color: '#D9363E', textAlign: 'center', marginBottom: 12 }}>{loadError}</Text>}
      {!loadError && !people.length && <Text style={{ color: '#71809A', textAlign: 'center', marginTop: 16 }}>No users have been added yet.</Text>}
      {people.map((p, index) => (
        <Pressable
          key={p[1]}
          onPress={() => index === 1 && setOpen(!open)}
          style={[team.card, index === 1 && open && team.openCard]}
        >
          <View style={team.initials}>
            <Text style={team.initialText}>{p[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text style={team.name}>{p[1]}</Text>
              <Text style={team.role}>{p[2]}</Text>
            </View>
            <Text style={team.email}>{p[3]}</Text>
            <Text style={team.access}>{p[4]}</Text>
          </View>
          <Text style={team.chev}>
            {index === 0 ? "⌾" : index === 1 && open ? "⌃" : "⌄"}
          </Text>
          {index === 1 && open && (
            <View style={team.expand}>
              <Text style={ui.fieldLabel}>BUSINESS ACCESS</Text>
              {[
                "Westside Retail",
                "Harbour Compounding",
                "Nanaimo Corner Mart",
              ].map((business, i) => (
                <View style={team.toggleRow} key={business}>
                  <Text style={team.toggleLabel}>{business}</Text>
                  <View style={[team.toggle, i === 0 && team.toggleOn]}>
                    <View style={team.knob} />
                  </View>
                </View>
              ))}
              <Pressable style={team.remove}>
                <Text style={team.removeText}>Remove user</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}
function AddUser({ token, businesses, onBack, onSaved }: { token: string; businesses: Array<{ id: string; name: string; slug: string }>; onBack: () => void; onSaved: () => void }) {
  const [role, setRole] = useState("Staff");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>(businesses.map((business) => business.id));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; success: boolean } | null>(null);
  const saveUser = async () => {
    if (!email.trim()) {
      setToast({ text: "Enter an email address to add a user.", success: false });
      return;
    }
    setSaving(true);
    try {
      await createUser(token, { name: name.trim() || email.trim().split('@')[0], email: email.trim(), role: role.toLowerCase() as 'staff' | 'accountant', businessIds: selectedBusinessIds });
      setToast({ text: `${email.trim()} was added successfully.`, success: true });
      setEmail("");
      setName("");
    } catch (error) {
      setToast({ text: error instanceof Error ? error.message : "Unable to add user. Please try again.", success: false });
    } finally { setSaving(false); }
  };
  return (
    <ScrollView contentContainerStyle={team.screen}>
      <View style={team.header}>
        <Pressable onPress={onBack} style={team.back}>
          <Text style={team.backText}>‹</Text>
        </Pressable>
        <Text style={team.title}>Add user</Text>
      </View>
      <View style={team.form}>
        <Text style={team.formLabel}>
          Email <Text style={{ color: "#F02E35" }}>*</Text>
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="name@company.com"
          placeholderTextColor="#9AA6BF"
          keyboardType="email-address"
          style={team.input}
        />
        <Text style={[team.formLabel, { marginTop: 20 }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Optional"
          placeholderTextColor="#9AA6BF"
          style={team.input}
        />
        <Text style={[team.formLabel, { marginTop: 20 }]}>Role</Text>
        <View style={team.roles}>
          {["Staff", "Accountant"].map((x) => (
            <Pressable
              key={x}
              onPress={() => setRole(x)}
              style={[team.roleChoice, role === x && team.roleChoiceOn]}
            >
              <Text
                style={[
                  team.roleChoiceText,
                  role === x && team.roleChoiceTextOn,
                ]}
              >
                {x}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={team.help}>
          {role === "Staff"
            ? "Can upload bills and edit transactions."
            : "Can review financial data and reports."}
        </Text>
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
      <Pressable onPress={saveUser} disabled={saving} style={[team.submit, saving && { opacity: 0.55 }]}>
        <Text style={team.submitText}>{saving ? "Adding…" : "Add user"}</Text>
      </Pressable>
      {!!toast && <View style={[team.toast, toast.success ? team.toastSuccess : team.toastError]}><Text style={[team.toastText, toast.success ? team.toastSuccessText : team.toastErrorText]}>{toast.text}</Text></View>}
      <Text style={team.bottomHelp}>
        They sign in with this email and see only the businesses selected above.
      </Text>
    </ScrollView>
  );
}
const team = StyleSheet.create({
  screen: { padding: 18, paddingBottom: 125, backgroundColor: "#F4F6FA" },
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
  card: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E6EF",
    borderRadius: 23,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    overflow: "hidden",
  },
  openCard: { paddingBottom: 0 },
  initials: {
    height: 58,
    width: 58,
    borderRadius: 19,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  initialText: { fontSize: 18, fontWeight: "700", color: "#5C70FF" },
  name: { fontSize: 18, fontWeight: "700", color: "#17223A" },
  role: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6D7990",
    backgroundColor: "#EEF0F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  email: { fontSize: 15, color: "#65728B", marginTop: 3 },
  access: { fontSize: 14, color: "#97A3BA", marginTop: 3 },
  chev: { fontSize: 22, color: "#93A0B9", paddingLeft: 8 },
  expand: {
    marginTop: 16,
    marginHorizontal: -16,
    padding: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderColor: "#E9EDF3",
  },
  toggleRow: {
    height: 68,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E6EF",
    backgroundColor: "#FAFBFD",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 11,
  },
  toggleLabel: { fontSize: 16, color: "#202A40", fontWeight: "500" },
  toggle: {
    height: 36,
    width: 62,
    borderRadius: 20,
    backgroundColor: "#D5DAE8",
    padding: 4,
    justifyContent: "center",
  },
  toggleOn: { backgroundColor: "#5C70FF", alignItems: "flex-end" },
  knob: { height: 28, width: 28, borderRadius: 14, backgroundColor: "#FFF" },
  remove: {
    height: 58,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#FFC7C9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  removeText: { fontSize: 16, fontWeight: "700", color: "#F02E35" },
  toast: { marginTop: 13, minHeight: 48, borderRadius: 14, paddingHorizontal: 15, justifyContent: "center" },
  toastSuccess: { backgroundColor: "#EAF6EF" },
  toastError: { backgroundColor: "#FFF0F1" },
  toastText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  toastSuccessText: { color: "#159148" },
  toastErrorText: { color: "#D9363E" },
  form: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E6EF",
    borderRadius: 23,
    padding: 20,
    marginBottom: 18,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#17223A",
    marginBottom: 10,
  },
  input: {
    height: 62,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E0E5EF",
    paddingHorizontal: 16,
    fontSize: 17,
    color: "#17223A",
  },
  roles: {
    height: 64,
    borderRadius: 17,
    backgroundColor: "#E8EBF4",
    padding: 6,
    flexDirection: "row",
  },
  roleChoice: {
    flex: 1,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  roleChoiceOn: {
    backgroundColor: "#FFF",
    shadowColor: "#99A2B8",
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 1,
  },
  roleChoiceText: { fontSize: 16, color: "#61708B", fontWeight: "600" },
  roleChoiceTextOn: { color: "#17223A" },
  help: { fontSize: 14, color: "#91A0B8", marginTop: 13 },
  sectionTitle: { fontSize: 19, fontWeight: "700", color: "#17223A" },
  submit: {
    height: 66,
    borderRadius: 20,
    backgroundColor: "#A8B1FA",
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { fontSize: 19, fontWeight: "700", color: "#FFF" },
  bottomHelp: {
    fontSize: 14,
    color: "#94A1B9",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 19,
    paddingHorizontal: 20,
  },
});
function More({
  onLogout,
  onBusinesses,
  onTeam,
  onCharts,
  onReports,
  onProfile,
}: {
  onLogout: () => void;
  onBusinesses: () => void;
  onTeam: () => void;
  onCharts: () => void;
  onReports: () => void;
  onProfile: () => void;
}) {
  const rows = [
    ["Charts", onCharts, BarChart3],
    ["Reports", onReports, FileText],
    ["Businesses", onBusinesses, Building2],
    ["Users", onTeam, UsersRound],
    ["Profile", onProfile, UserRound],
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

function NavIcon({ page, active }: { page: string; active: boolean }) {
  const color = active ? "#5B6CFF" : "#9AA5BB";
  const props = { size: 26, color, strokeWidth: active ? 2.7 : 2 };
  if (page === "home") return <HomeIcon {...props} />;
  if (page === "transactions") return <List {...props} />;
  if (page === "receipts") return <ReceiptText {...props} />;
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
    ["transactions", "Transactions"],
    ["receipts", "Bills"],
    ["more", "More"],
  ];
  return (
    <View style={s.nav}>
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
  businesses: Array<{ id: string; name: string; slug: string }>;
  selectedBusinessId: string | null;
  onClose: () => void;
  onChoose: (businessId: string) => void;
  onAdd: () => void;
}) {
  const b = [...businesses.map((business) => ({ id: business.id, name: business.name, subtitle: `${business.name} · BC` })), { id: 'new', name: '+ Add business', subtitle: 'Create another business' }];
  return (
    <View style={s.overlay}>
      <Pressable style={s.overlayTap} onPress={onClose} />
      <SlideUpSheet style={s.homeBusiness}>
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
            <View>
              <Text style={s.homeBusinessName}>{business.name}</Text>
              <Text style={s.homeBusinessSub}>{business.subtitle}</Text>
            </View>
            {business.id === selectedBusinessId && <Text style={s.check}>✓</Text>}
          </Pressable>
        ))}
      </SlideUpSheet>
    </View>
  );
}

function BankSheet({ accounts, selectedBankId, onChoose, onAdd, onClose }: { accounts: Workspace['bankAccounts']; selectedBankId: string | null; onChoose: (bankId: string) => void; onAdd: () => void; onClose: () => void }) {
  return (
    <View style={s.overlay}>
      <Pressable style={s.overlayTap} onPress={onClose} />
      <SlideUpSheet style={s.business}>
        <View style={s.handle} />
        <View style={s.businessHead}>
          <Text style={s.businessTitle}>Select bank account</Text>
          <Pressable style={s.close} onPress={onClose}>
            <Text style={s.closeText}>×</Text>
          </Pressable>
        </View>
        {accounts.map((account) => (
          <Pressable
            onPress={() => onChoose(account.id)}
            key={account.id}
            style={[s.businessRow, account.id === selectedBankId && s.businessSelected]}
          >
            <View style={s.bankAccountInfo}>
              <Text numberOfLines={1} style={s.businessName}>{account.name}</Text>
              <Text style={s.businessSub}>{account.maskedNumber} · {money(account.balance)}</Text>
            </View>
            {account.id === selectedBankId && <Text style={s.check}>✓</Text>}
          </Pressable>
        ))}
        <Pressable onPress={onAdd} style={s.bankAddRow}><View style={s.bankAddIcon}><Text style={s.bankAddIconText}>+</Text></View><Text style={s.bankAddText}>Add institution</Text><Text style={s.bankAddHint}>New bank account</Text><ChevronRight size={20} color="#2463EB" /></Pressable>
      </SlideUpSheet>
    </View>
  );
}

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
      <SlideUpSheet style={s.business}>
        <View style={s.handle} />
        <View style={s.businessHead}>
          <Text style={s.businessTitle}>Date range</Text>
          <Pressable style={s.close} onPress={onClose}>
            <Text style={s.closeText}>×</Text>
          </Pressable>
        </View>
        {periods.map((period, index) => (
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
      <SlideUpSheet style={s.business}>
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
  accountSheet: { paddingTop: 12, paddingBottom: 20 },
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
  accountGoogle: { alignItems: "center", marginTop: 0 },
  choose: {
    color: "#101A32",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
  },
  chooseSub: {
    color: "#66748F",
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 14,
  },
  account: {
    height: 78,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0E5EF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  accountSelected: { backgroundColor: "#F2F4F8" },
  avatar: {
    height: 48,
    width: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  accountName: { fontSize: 16, color: "#101A32", fontWeight: "800" },
  email: { fontSize: 14, color: "#66748F", marginTop: 2 },
  other: { flexDirection: "row", alignItems: "center", paddingTop: 4, paddingLeft: 2 },
  otherIcon: { height: 48, width: 48, borderRadius: 24, borderWidth: 1, borderColor: "#E1E6F0", alignItems: "center", justifyContent: "center", marginRight: 12 },
  otherText: { fontSize: 16, fontWeight: "800", color: "#101A32" },
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
    height: 104,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#E1E5EF",
    flexDirection: "row",
    paddingTop: 13,
  },
  navItem: { flex: 1, alignItems: "center", paddingTop: 2, borderRadius: 16 },
  navItemPressed: { opacity: 0.72 },
  navIcon: { fontSize: 24, color: "#9AA5BB", fontWeight: "700" },
  navText: { fontSize: 12, color: "#909BB4", marginTop: 4 },
  navActive: { color: "#5367FF", fontWeight: "800" },
  overlay: {
    position: "absolute",
    top: 0,
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
  bankAddRow: { minHeight: 58, borderRadius: 16, borderStyle: 'dashed', borderColor: '#A8B6FF', borderWidth: 1, marginTop: 6, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  bankAddIcon: { height: 28, width: 28, borderRadius: 14, backgroundColor: '#EAF0FF', alignItems: 'center', justifyContent: 'center' },
  bankAddIconText: { color: '#2463EB', fontSize: 22, fontWeight: '700', marginTop: -2 },
  bankAddText: { color: '#2463EB', fontSize: 16, fontWeight: '800' },
  bankAddHint: { color: '#75829A', fontSize: 13, marginLeft: 'auto' },
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
