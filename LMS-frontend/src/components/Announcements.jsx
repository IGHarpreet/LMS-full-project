import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Badge, Button, Calendar, Card, Col, DatePicker, Descriptions,
  Divider, Empty, Form, Input, List, message, Modal, Popconfirm, Progress,
  Row, Select, Space, Spin, Statistic, Switch, Table, Tabs, Tag, Tooltip, Typography, Upload,
} from "antd";
import {
  BellOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  DeleteOutlined, DownloadOutlined, EditOutlined, EyeOutlined, FileTextOutlined,
  LockOutlined, PhoneOutlined,
  PaperClipOutlined, PushpinFilled, PushpinOutlined, PlusOutlined, SearchOutlined,
  SendOutlined, TeamOutlined, TrophyOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import PageHeader from "./PageHeader";
import { getUser } from "../utils/auth";
import { BASE_URL, getErrorMessage } from "../shared/api";
import "./Announcements.css";

const CATEGORIES = ["General", "HR", "Policy", "Payroll", "Leave", "Holiday", "Events", "IT", "Training", "Emergency"];
const priorityColor = { normal: "default", important: "orange", urgent: "red" };
const statusColor = { draft: "default", scheduled: "blue", published: "green", archived: "purple" };

const eventDate = (event) => {
  const raw = event?.start?.date || event?.start?.dateTime || event?.festivalDate || event?.date;
  if (!raw) return null;
  const parsed = moment(raw);
  return parsed.isValid() ? parsed : null;
};
const eventTimeLabel = (event) => {
  if (event?.start?.date) return "All day";
  const start = event?.start?.dateTime ? moment(event.start.dateTime) : null;
  const end = event?.end?.dateTime ? moment(event.end.dateTime) : null;
  return start?.isValid() ? `${start.format("h:mm A")}${end?.isValid() ? ` – ${end.format("h:mm A")}` : ""}` : "All day";
};
const eventType = (event) => {
  const source = String(event?.calendarSource || event?.source || event?._eventSource || "").toLowerCase();
  if (source.includes("indian") || source.includes("holiday") || event?.festival) return "Holiday";
  if (source.includes("company")) return "Company event";
  return "Meeting / event";
};
const eventColor = (event) => eventType(event) === "Holiday" ? "green" : eventType(event) === "Company event" ? "purple" : "blue";
const attachmentUrl = (url) => /^https?:\/\//i.test(url || "") ? url : `${BASE_URL}${url || ""}`;

const Announcements = () => {
  const user = getUser() || {};
  const isManager = ["admin", "hr"].includes(String(user.role || "").toLowerCase());
  const [activeTab, setActiveTab] = useState("overview");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [modalOpen, setModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [analyticsItem, setAnalyticsItem] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [audienceOptions, setAudienceOptions] = useState({ employees: [], departments: [] });
  const [saving, setSaving] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);

    try {
      let token = localStorage.getItem("access_token1");

      // Remove accidental quotation marks
      token = token?.replace(/^["']|["']$/g, "");

      if (!token) {
        throw new Error("Login session token not found. Please sign in again.");
      }

      const params = {};

      if (isManager && statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (categoryFilter !== "all") {
        params.category = categoryFilter;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await axios.get(`${BASE_URL}/announcements`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setItems(
        Array.isArray(response.data?.announcements)
          ? response.data.announcements
          : []
      );
    } catch (error) {
      console.error("Fetch announcements error:", error.response?.data || error);
      message.error(getErrorMessage(error, "Unable to load announcements."));
    } finally {
      setLoading(false);
    }
  }, [isManager, statusFilter, categoryFilter, search]);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const [googleResult, companyResult] = await Promise.allSettled([
        axios.get(`${BASE_URL}/holiday/allindianholidays`),
        axios.get(`${BASE_URL}/holiday`),
      ]);
      let merged = [];
      if (googleResult.status === "fulfilled") {
        const googleEvents = googleResult.value?.data?.googleevents;
        if (Array.isArray(googleEvents)) merged = merged.concat(googleEvents.map((event) => ({ ...event, _eventSource: event.calendarSource || event.source || "Google Calendar" })));
      }
      if (companyResult.status === "fulfilled") {
        const companyHolidays = companyResult.value?.data?.HolidaysPending;
        if (Array.isArray(companyHolidays)) merged = merged.concat(companyHolidays.map((holiday) => ({
          id: `mongo-${holiday._id}`,
          summary: holiday.festival || "Company holiday",
          description: "Company holiday",
          start: { date: moment(holiday.festivalDate).format("YYYY-MM-DD") },
          _eventSource: "company-holiday", source: "company-holiday",
        })));
      }
      const unique = new Map();
      merged.forEach((event) => {
        const date = eventDate(event)?.format("YYYY-MM-DD");
        if (!date) return;
        const key = `${String(event.summary || event.festival || "Event").toLowerCase()}-${date}`;
        if (!unique.has(key)) unique.set(key, event);
      });
      setEvents([...unique.values()].sort((a, b) => eventDate(a)?.valueOf() - eventDate(b)?.valueOf()));
    } catch (_error) {
      setEvents([]);
    } finally { setEventsLoading(false); }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);
  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => {
    if (!isManager) return;
    axios.get(`${BASE_URL}/announcements/meta/audience`)
      .then((res) => setAudienceOptions({ employees: res.data?.employees || [], departments: res.data?.departments || [] }))
      .catch(() => { });
  }, [isManager]);

  const unreadCount = items.filter((item) => !item.isRead).length;
  const pendingAck = items.filter((item) => item.requiresAcknowledgement && !item.isAcknowledged).length;
  const publishedCount = items.filter((item) => item.status === "published").length;
  const draftCount = items.filter((item) => item.status === "draft").length;
  const scheduledCount = items.filter((item) => item.status === "scheduled").length;
  const nextEvents = useMemo(() => events.filter((e) => eventDate(e)?.endOf("day").isSameOrAfter(moment(), "day")).slice(0, 5), [events]);
  const selectedEvents = useMemo(() => events.filter((e) => eventDate(e)?.isSame(selectedDate, "day")), [events, selectedDate]);

  const openCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ category: "General", priority: "normal", audienceType: "all", publishAt: moment(), isPinned: false, requiresAcknowledgement: false });
    setModalOpen(true);
  };
  const openEdit = (item) => {
    setEditingItem(item);
    form.resetFields();
    form.setFieldsValue({
      title: item.title, summary: item.summary, content: item.content, category: item.category,
      priority: item.priority, audienceType: item.audience?.type || "all",
      departments: item.audience?.departments || [], employees: (item.audience?.employees || []).map((id) => String(id._id || id)),
      publishAt: item.publishAt ? moment(item.publishAt) : moment(), expiresAt: item.expiresAt ? moment(item.expiresAt) : null,
      isPinned: !!item.isPinned, requiresAcknowledgement: !!item.requiresAcknowledgement,
    });
    setModalOpen(true);
  };

  const submitAnnouncement = async (draft = false) => {
    try {
      const values = await form.validateFields();
      const audience = {
        type: values.audienceType || "all",
        departments: values.audienceType === "departments" ? values.departments || [] : [],
        employees: values.audienceType === "employees" ? values.employees || [] : [],
      };
      const payload = new FormData();
      ["title", "summary", "content", "category", "priority"].forEach((key) => payload.append(key, values[key] || ""));
      payload.append("audience", JSON.stringify(audience));
      payload.append("publishAt", (values.publishAt || moment()).toISOString());
      payload.append("expiresAt", values.expiresAt ? values.expiresAt.toISOString() : "");
      payload.append("isPinned", String(!!values.isPinned));
      payload.append("requiresAcknowledgement", String(!!values.requiresAcknowledgement));
      payload.append("status", draft ? "draft" : "published");
      (values.attachments?.fileList || []).forEach((file) => { if (file.originFileObj) payload.append("attachments", file.originFileObj); });
      setSaving(true);
      if (editingItem) await axios.put(`${BASE_URL}/announcements/${editingItem._id}`, payload);
      else await axios.post(`${BASE_URL}/announcements`, payload);
      message.success(draft ? "Draft saved." : editingItem ? "Announcement updated." : "Announcement published or scheduled.");
      setModalOpen(false);
      await fetchAnnouncements();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error, "Unable to save announcement."));
    } finally { setSaving(false); }
  };

  const markRead = async (item) => {
    if (!item?._id || item.isRead) return;
    try {
      await axios.post(`${BASE_URL}/announcements/${item._id}/read`);
      setItems((old) => old.map((x) => String(x._id) === String(item._id) ? { ...x, isRead: true } : x));
      setDetailItem((old) => old && String(old._id) === String(item._id) ? { ...old, isRead: true } : old);
    } catch (error) { message.error(getErrorMessage(error, "Unable to mark as read.")); }
  };
  const openDetails = async (item) => {
    setDetailItem(item);
    if (!isManager) await markRead(item);
  };
  const acknowledge = async (item) => {
    try {
      await axios.post(`${BASE_URL}/announcements/${item._id}/acknowledge`);
      setItems((old) => old.map((x) => String(x._id) === String(item._id) ? { ...x, isAcknowledged: true } : x));
      setDetailItem((old) => old && String(old._id) === String(item._id) ? { ...old, isAcknowledged: true } : old);
      message.success("Your acknowledgement has been recorded.");
    } catch (error) { message.error(getErrorMessage(error, "Unable to record acknowledgement.")); }
  };
  const downloadAttachment = async (file) => {
    try {
      const response = await axios.get(attachmentUrl(file.url), { responseType: "blob" });
      const objectUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.originalName || "announcement-attachment";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to download attachment."));
    }
  };

  const managerAction = async (url, method = "patch", data = {}) => {
    try { await axios[method](`${BASE_URL}${url}`, data); message.success("Announcement updated."); await fetchAnnouncements(); }
    catch (error) { message.error(getErrorMessage(error, "Action failed.")); }
  };
  const openAnalytics = async (item) => {
    setAnalyticsItem(item); setAnalytics(null); setAnalyticsLoading(true);
    try { const res = await axios.get(`${BASE_URL}/announcements/${item._id}/analytics`); setAnalytics(res.data); }
    catch (error) { message.error(getErrorMessage(error, "Unable to load analytics.")); }
    finally { setAnalyticsLoading(false); }
  };

  const renderAnnouncement = (item) => (
    <Card key={item._id} className={`announcement-card ${item.isRead ? "is-read" : "is-unread"}`} bordered>
      <div className="announcement-card-top">
        <Space wrap size={[6, 6]}>
          {!isManager && !item.isRead && <Badge status="processing" text="New" />}
          <Tag color={priorityColor[item.priority] || "default"}>{String(item.priority || "normal").toUpperCase()}</Tag>
          <Tag>{item.category}</Tag>
          {isManager && <Tag color={statusColor[item.status]}>{item.status}</Tag>}
          {item.isPinned && <Tag color="gold" icon={<PushpinFilled />}>Pinned</Tag>}
        </Space>
        <Typography.Text type="secondary" className="announcement-date">{moment(item.publishAt || item.createdAt).fromNow()}</Typography.Text>
      </div>
      <Typography.Title level={4} className="announcement-title">{item.title}</Typography.Title>
      {item.summary && <Typography.Paragraph className="announcement-summary">{item.summary}</Typography.Paragraph>}
      <div className="announcement-card-meta">
        <span><TeamOutlined /> {item.audience?.type === "all" ? "All employees" : item.audience?.type === "departments" ? (item.audience.departments || []).join(", ") || "Selected departments" : "Selected employees"}</span>
        {item.requiresAcknowledgement && <Tag color={item.isAcknowledged ? "green" : "orange"}>{item.isAcknowledged ? "Acknowledged" : "Acknowledgement required"}</Tag>}
      </div>
      <Divider className="announcement-divider" />
      <div className="announcement-actions">
        <Button type="link" onClick={() => openDetails(item)} icon={<EyeOutlined />}>Read details</Button>
        {isManager ? (
          <Space wrap>
            <Tooltip title={item.isPinned ? "Unpin" : "Pin to top"}><Button size="small" icon={item.isPinned ? <PushpinFilled /> : <PushpinOutlined />} onClick={() => managerAction(`/announcements/${item._id}/pin`, "patch", { isPinned: !item.isPinned })} /></Tooltip>
            <Tooltip title="Read analytics"><Button size="small" icon={<TrophyOutlined />} onClick={() => openAnalytics(item)} /></Tooltip>
            <Tooltip title="Edit"><Button size="small" icon={<EditOutlined />} onClick={() => openEdit(item)} /></Tooltip>
            {item.status === "archived" ? (
              <Tooltip title="Unarchive announcement">
                <Button
                  size="small"
                  type="primary"
                  ghost
                  icon={<InboxOutlined />}
                  onClick={() =>
                    managerAction(`/announcements/${item._id}/unarchive`)
                  }
                />
              </Tooltip>
            ) : (
              <Tooltip title="Archive announcement">
                <Button
                  size="small"
                  icon={<LockOutlined />}
                  onClick={() =>
                    managerAction(`/announcements/${item._id}/archive`)
                  }
                />
              </Tooltip>
            )}
            <Popconfirm title="Delete this announcement?" description="Its read and acknowledgement records will also be deleted." onConfirm={() => managerAction(`/announcements/${item._id}`, "delete")} okText="Delete" cancelText="Cancel"><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
          </Space>
        ) : item.requiresAcknowledgement && !item.isAcknowledged ? (
          <Button size="small" type="primary" onClick={() => acknowledge(item)} icon={<CheckCircleOutlined />}>Acknowledge</Button>
        ) : null}
      </div>
    </Card>
  );

  const dateCellRender = (value) => {
    const dayEvents = events.filter((event) => eventDate(event)?.isSame(value, "day"));
    if (!dayEvents.length) return null;
    return <div className="hub-calendar-dots">{dayEvents.slice(0, 2).map((event, index) => <Badge key={`${event.id || event.summary}-${index}`} color={eventColor(event)} text={<span className="hub-calendar-event-name">{event.summary || event.festival || "Event"}</span>} />)}{dayEvents.length > 2 && <Typography.Text type="secondary">+{dayEvents.length - 2} more</Typography.Text>}</div>;
  };

  const eventList = (list) => <List
    dataSource={list}
    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No events scheduled." /> }}
    renderItem={(event, index) => {
      const date = eventDate(event);
      return <List.Item key={`${event.id || event.summary}-${index}`} className="hub-event-item">
        <div className="hub-event-date"><strong>{date?.format("DD") || "—"}</strong><span>{date?.format("MMM") || ""}</span></div>
        <div className="hub-event-content"><Typography.Text strong>{event.summary || event.festival || "Untitled event"}</Typography.Text><div className="hub-event-meta"><Tag color={eventColor(event)}>{eventType(event)}</Tag><Typography.Text type="secondary">{date?.format("ddd, D MMM YYYY")} · {eventTimeLabel(event)}</Typography.Text></div>{event.description && <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} className="hub-event-description">{event.description}</Typography.Paragraph>}</div>
      </List.Item>;
    }}
  />;

  const tabs = [
    { key: "overview", label: <span><BellOutlined /> Overview</span> },
    { key: "announcements", label: <span><PhoneOutlined /> {isManager ? "Manage announcements" : "All announcements"}</span> },
    { key: "calendar", label: <span><CalendarOutlined /> Calendar & events</span> },
  ];

  return (
    <div className="announcement-hub">
      <PageHeader title="Company Hub" subtitle="Company updates, important notices, meetings and holidays in one place." extra={isManager ? <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Create announcement</Button> : <Tag color="blue">Employee workspace</Tag>} showClock={false} />

      <Row gutter={[14, 14]} className="hub-stats">
        <Col xs={12} md={6}><Card><Statistic title={isManager ? "Published" : "Unread announcements"} value={isManager ? publishedCount : unreadCount} prefix={<PhoneOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title={isManager ? "Drafts" : "Pending acknowledgement"} value={isManager ? draftCount : pendingAck} prefix={<FileTextOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title={isManager ? "Scheduled" : "Upcoming events"} value={isManager ? scheduledCount : nextEvents.length} prefix={<CalendarOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Calendar items" value={events.length} prefix={<ClockCircleOutlined />} /></Card></Col>
      </Row>

      <Card className="hub-main-card" bordered={false}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
        {activeTab === "overview" && (
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={15}>
              <div className="hub-section-heading"><div><Typography.Title level={4}>Latest announcements</Typography.Title><Typography.Text type="secondary">The latest updates shared with your audience.</Typography.Text></div><Button type="link" onClick={() => setActiveTab("announcements")}>View all</Button></div>
              <Spin spinning={loading}>{items.filter((x) => isManager ? x.status === "published" || x.status === "scheduled" : true).slice(0, 3).length ? <div className="announcement-list">{items.filter((x) => isManager ? x.status === "published" || x.status === "scheduled" : true).slice(0, 3).map(renderAnnouncement)}</div> : <Empty description="No announcements yet." />}</Spin>
            </Col>
            <Col xs={24} lg={9}>
              <div className="hub-section-heading"><div><Typography.Title level={4}>Upcoming events</Typography.Title><Typography.Text type="secondary">Synced from your Google and company calendars.</Typography.Text></div><Button type="link" onClick={() => setActiveTab("calendar")}>Full calendar</Button></div>
              <Spin spinning={eventsLoading}>{eventList(nextEvents)}</Spin>
              <Alert className="hub-calendar-note" type="info" showIcon message="Calendar is read-only" description="Meetings and holidays are fetched from your connected calendars. Manage calendar events in Google Calendar." />
            </Col>
          </Row>
        )}
        {activeTab === "announcements" && (
          <>
            <div className="hub-toolbar">
              <Input allowClear prefix={<SearchOutlined />} placeholder="Search announcements..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
              <Space wrap>
                {isManager && <Select value={statusFilter} onChange={setStatusFilter} style={{ minWidth: 145 }} options={[{ value: "all", label: "All statuses" }, ...["published", "draft", "scheduled", "archived"].map((x) => ({ value: x, label: x.charAt(0).toUpperCase() + x.slice(1) }))]} />}
                <Select value={categoryFilter} onChange={setCategoryFilter} style={{ minWidth: 150 }} options={[{ value: "all", label: "All categories" }, ...CATEGORIES.map((x) => ({ value: x, label: x }))]} />
                {isManager && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New announcement</Button>}
              </Space>
            </div>
            <Spin spinning={loading}>{items.length ? <div className="announcement-list">{items.map(renderAnnouncement)}</div> : <Empty description="No announcements match your filters." />}</Spin>
          </>
        )}
        {activeTab === "calendar" && (
          <Row gutter={[20, 20]}>
            <Col xs={24} xl={15}>
              <div className="hub-section-heading"><div><Typography.Title level={4}>Company calendar</Typography.Title><Typography.Text type="secondary">Meetings, company events and Indian holidays.</Typography.Text></div><Button icon={<DownloadOutlined />} onClick={fetchEvents}>Refresh calendar</Button></div>
              <Spin spinning={eventsLoading}><Calendar value={selectedDate} onSelect={setSelectedDate} onPanelChange={setSelectedDate} dateCellRender={dateCellRender} /></Spin>
              <div className="hub-calendar-legend"><Tag color="blue">Meetings / events</Tag><Tag color="green">Indian holidays</Tag><Tag color="purple">Company events</Tag></div>
            </Col>
            <Col xs={24} xl={9}>
              <Typography.Title level={4}>{selectedDate.format("D MMMM YYYY")}</Typography.Title>
              <Typography.Text type="secondary">Events on the selected date</Typography.Text>
              <Divider />
              {eventsLoading ? <Spin /> : eventList(selectedEvents)}
              <Divider />
              <Typography.Title level={5}>Coming up</Typography.Title>
              {eventList(nextEvents)}
            </Col>
          </Row>
        )}
      </Card>

      <Modal title={editingItem ? "Edit announcement" : "Create announcement"} visible={modalOpen} onCancel={() => setModalOpen(false)} width={760} destroyOnClose footer={[
        <Button key="cancel" onClick={() => setModalOpen(false)}>Cancel</Button>,
        <Button key="draft" loading={saving} onClick={() => submitAnnouncement(true)}>Save draft</Button>,
        <Button key="publish" type="primary" loading={saving} icon={<SendOutlined />} onClick={() => submitAnnouncement(false)}>{editingItem ? "Save changes" : "Publish announcement"}</Button>,
      ]}>
        <Form form={form} layout="vertical" initialValues={{ category: "General", priority: "normal", audienceType: "all" }}>
          <Form.Item name="title" label="Announcement title" rules={[{ required: true, whitespace: true, message: "Enter a title." }, { max: 180 }]}><Input placeholder="e.g. Updated office timings" /></Form.Item>
          <Form.Item name="summary" label="Short summary"><Input maxLength={300} showCount placeholder="A short preview shown in the announcement feed" /></Form.Item>
          <Form.Item name="content" label="Announcement details" rules={[{ required: true, whitespace: true, message: "Enter the announcement details." }]}><Input.TextArea rows={5} placeholder="Write the full announcement here..." /></Form.Item>
          <Row gutter={12}>
            <Col xs={24} sm={8}><Form.Item name="category" label="Category" rules={[{ required: true }]}><Select options={CATEGORIES.map((x) => ({ value: x, label: x }))} /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="priority" label="Priority"><Select options={[{ value: "normal", label: "Normal" }, { value: "important", label: "Important" }, { value: "urgent", label: "Urgent" }]} /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="audienceType" label="Audience"><Select options={[{ value: "all", label: "All employees" }, { value: "departments", label: "Departments" }, { value: "employees", label: "Selected employees" }]} /></Form.Item></Col>
          </Row>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.audienceType !== curr.audienceType}>
            {({ getFieldValue }) => getFieldValue("audienceType") === "departments" ? <Form.Item name="departments" label="Select departments" rules={[{ required: true, type: "array", min: 1 }]}><Select mode="multiple" placeholder="Choose departments" options={audienceOptions.departments.map((x) => ({ value: x, label: x }))} /></Form.Item> : getFieldValue("audienceType") === "employees" ? <Form.Item name="employees" label="Select employees" rules={[{ required: true, type: "array", min: 1 }]}><Select mode="multiple" showSearch optionFilterProp="label" placeholder="Choose employees" options={audienceOptions.employees.map((x) => ({ value: String(x._id), label: `${x.name || "Unnamed"}${x.email ? ` (${x.email})` : ""}` }))} /></Form.Item> : null}
          </Form.Item>
          <Row gutter={12}>
            <Col xs={24} sm={12}><Form.Item name="publishAt" label="Publish date & time" rules={[{ required: true }]}><DatePicker showTime style={{ width: "100%" }} format="DD MMM YYYY, hh:mm A" /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="expiresAt" label="Expiry date (optional)"><DatePicker showTime style={{ width: "100%" }} format="DD MMM YYYY, hh:mm A" /></Form.Item></Col>
          </Row>
          <Row gutter={20}>
            <Col><Form.Item name="isPinned" label="Pin to top" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col><Form.Item name="requiresAcknowledgement" label="Require acknowledgement" valuePropName="checked"><Switch /></Form.Item></Col>
          </Row>
          <Form.Item name="attachments" valuePropName="fileList" getValueFromEvent={(event) => event?.fileList || []} label="Attachments (up to 5 files, 10 MB each)"><Upload beforeUpload={() => false} multiple maxCount={5} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"><Button icon={<PaperClipOutlined />}>Choose files</Button></Upload></Form.Item>
          {editingItem?.attachments?.length > 0 && <Alert type="info" showIcon message="Existing attachments are retained. New files will be added when you save." />}
        </Form>
      </Modal>

      <Modal title="Announcement details" visible={!!detailItem} onCancel={() => setDetailItem(null)} footer={detailItem?.requiresAcknowledgement && !isManager && !detailItem?.isAcknowledged ? <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => acknowledge(detailItem)}>I acknowledge this announcement</Button> : <Button onClick={() => setDetailItem(null)}>Close</Button>}>
        {detailItem && <div className="announcement-detail"><Space wrap><Tag color={priorityColor[detailItem.priority]}>{String(detailItem.priority).toUpperCase()}</Tag><Tag>{detailItem.category}</Tag>{detailItem.isPinned && <Tag color="gold">Pinned</Tag>}</Space><Typography.Title level={3}>{detailItem.title}</Typography.Title>{detailItem.summary && <Typography.Paragraph type="secondary">{detailItem.summary}</Typography.Paragraph>}<Typography.Paragraph className="announcement-detail-content">{detailItem.content}</Typography.Paragraph><Divider /><Descriptions size="small" column={1}><Descriptions.Item label="Published">{moment(detailItem.publishAt || detailItem.createdAt).format("DD MMM YYYY, hh:mm A")}</Descriptions.Item><Descriptions.Item label="Audience">{detailItem.audience?.type === "all" ? "All employees" : detailItem.audience?.type === "departments" ? (detailItem.audience.departments || []).join(", ") : "Selected employees"}</Descriptions.Item><Descriptions.Item label="Acknowledgement">{detailItem.requiresAcknowledgement ? detailItem.isAcknowledged ? "Acknowledged" : "Required" : "Not required"}</Descriptions.Item></Descriptions>{detailItem.attachments?.length > 0 && <><Divider /><Typography.Text strong>Attachments</Typography.Text><List size="small" dataSource={detailItem.attachments} renderItem={(file) => <List.Item><Button type="link" icon={<DownloadOutlined />} onClick={() => downloadAttachment(file)}>{file.originalName}</Button></List.Item>} /></>}</div>}
      </Modal>

      <Modal title={`Announcement analytics${analyticsItem ? ` – ${analyticsItem.title}` : ""}`} visible={!!analyticsItem} onCancel={() => { setAnalyticsItem(null); setAnalytics(null); }} footer={<Button onClick={() => { setAnalyticsItem(null); setAnalytics(null); }}>Close</Button>} width={760}>
        <Spin spinning={analyticsLoading}>{analytics && <><Row gutter={12}><Col span={8}><Statistic title="Audience" value={analytics.totalAudience} /></Col><Col span={8}><Statistic title="Read" value={analytics.readCount} /></Col><Col span={8}><Statistic title="Acknowledged" value={analytics.acknowledgementCount} /></Col></Row><Progress percent={analytics.totalAudience ? Math.round((analytics.readCount / analytics.totalAudience) * 100) : 0} status="active" />{analyticsItem?.requiresAcknowledgement && <Typography.Text type="secondary">{analytics.pendingAcknowledgementCount} acknowledgement(s) pending</Typography.Text>}<Divider /><Typography.Title level={5}>Read by</Typography.Title><Table size="small" rowKey={(row) => row._id} dataSource={analytics.reads || []} pagination={{ pageSize: 5 }} columns={[{ title: "Employee", render: (_, r) => r.employee?.name || "—" }, { title: "Email", render: (_, r) => r.employee?.email || "—" }, { title: "Read at", dataIndex: "readAt", render: (v) => v ? moment(v).format("DD MMM YYYY, hh:mm A") : "—" }]} /></>}</Spin>
      </Modal>
    </div>
  );
};

export default Announcements;
