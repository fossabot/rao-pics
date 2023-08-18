import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";

import { CONSTANT } from "@acme/constant";

import "./home.css";

import Empty from "./components/Empty";
import { FailLogs } from "./components/FailLogs";
import { NavBar } from "./components/NavBar";
import { trpc } from "./utils/trpc";

interface SyncSubscriptionData {
  current: number;
  libraryId: number;
  type: "folder" | "image";
}

let T: NodeJS.Timer;
let isInit = false;

function Home() {
  const utils = trpc.useContext();

  const { data: imageCount } = trpc.image.groupByFieldCount.useQuery("ext");
  const { data: config } = trpc.config.get.useQuery();
  const library = trpc.library.get.useQuery();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const removeLibrary = trpc.library.delete.useMutation();
  const updateLibrary = trpc.library.update.useMutation();
  /** 解决同步过程中，隐藏控制台，在打开进度显示异常问题 */
  const pending = Number(localStorage.getItem("pending") ?? 0);
  // 是否在初始化中 首次添加
  const [adding, setAdding] = useState<boolean>(false);
  const checkFailAndClean = trpc.utils.checkFailAndClean.useMutation();
  const [platform, setPlatform] = useState<NodeJS.Platform>();
  const [languages, setLanguages] = useState<Awaited<ReturnType<typeof window.app.getLanguages>>>();

  const lang = (config?.lang ?? "zh_cn").replace("-", "_") as keyof typeof languages;

  const language = useMemo(() => (languages ? languages[lang] : undefined), [lang, languages]);

  useEffect(() => {
    if (isInit) return;
    isInit = true;

    void (async () => {
      setLanguages(await window.app.getLanguages());
    })();
  }, []);

  const getPlatform = async () => {
    const res = await window.process.getPlatform();
    setPlatform(res);
  };

  if (typeof window !== "undefined") {
    void getPlatform();
  }

  const statistics = useMemo(() => {
    const json = {
      media: 0,
      image: 0,
    };
    imageCount?.forEach((item) => {
      if (CONSTANT.IMG_EXT.includes(item.ext)) {
        json.image += item._count._all;
      } else if (CONSTANT.VIDEO_EXT.includes(item.ext)) {
        json.media += item._count._all;
      }
    });

    return json;
  }, [imageCount]);

  void window.app.getVersion().then((res) => {
    document.title = `Rao Pics - v${res}`;
  });

  const [faillogsVisable, setFaillogsVisable] = useState(false);

  // active id
  const [active, setActive] = useState<number | undefined>();
  const activeItem = useMemo(() => library.data?.find((item) => item.id === active), [library, active]);

  const host = useMemo(() => (config ? `http://${config.ip}:${config.webPort}` : ""), [config]);
  const webUrl = useMemo(() => (host && activeItem ? `${host}/${activeItem.name}` : ""), [activeItem, host]);
  const openExternal = () => void window.shell.openExternal(webUrl);

  const [delConfirmVisable, setDelConfirmVisable] = useState<boolean>(false);

  useEffect(() => {
    const item = library.data?.[0];
    if (!item) {
      setDelConfirmVisable(false);
      setActive(undefined);
    } else {
      if (!active) {
        setActive(item.id);
      }
    }

    void window.electronAPI.createAssetsServer(library.data);
  }, [active, library]);

  const onRemove = () => {
    if (active) {
      void removeLibrary.mutateAsync({ id: active }).then(() => {
        void utils.library.get.invalidate();
        void utils.image.groupByFieldCount.invalidate();
      });
    }
  };

  // progress exits, sync is running
  const [progress, setProgress] = useState<SyncSubscriptionData>();
  trpc.sync.subscription.useSubscription(undefined, {
    onData(data) {
      const _data = data as SyncSubscriptionData;
      if (_data.type === "image") {
        setProgress(data as SyncSubscriptionData);
      }
    },
  });

  /** 禁止操作 */
  const disabled = useMemo(() => !!progress || adding, [progress, adding]);

  const percent = useMemo(() => {
    if (progress) {
      const { current } = progress;
      const count = (pending || activeItem?._count.pendings) ?? 0;

      if (count === 0) return 100;

      return ~~((current / count) * 100);
    }

    return 100;
  }, [activeItem?._count.pendings, pending, progress]);

  // sync completed.
  useEffect(() => {
    if (percent === 100 && progress && activeItem) {
      void updateLibrary
        .mutateAsync({
          id: activeItem.id,
        })
        .then(() => {
          checkFailAndClean.mutate({ libraryId: activeItem.id, libraryDir: activeItem.dir });
          void utils.library.get.invalidate();
          void utils.image.groupByFieldCount.invalidate();
          setProgress(undefined);
          localStorage.removeItem("pending");
        });
    }
  }, [percent, progress, activeItem, updateLibrary, checkFailAndClean, utils.library.get, utils.image.groupByFieldCount]);

  const sync = trpc.sync.start.useMutation();
  const onSyncClick = () => {
    if (!activeItem) return;

    localStorage.setItem("pending", activeItem._count.pendings.toString());

    // start sync
    void sync.mutateAsync({
      libraryId: activeItem.id,
    });
  };

  const showOpenDialog = () => {
    void window.dialog
      .showOpenDialog({
        properties: ["openDirectory"],
        title: "选择文件夹/库",
      })
      .then(async (res) => {
        if (!res) return;

        const isExits = library.data?.filter((item) => item.dir === res[0]).length ?? 0;
        if (isExits > 0) return window.dialog.showMessageBox({ message: "此文件夹已存在", type: "error" });

        const lib = await window.electronAPI.handleDirectory(res[0]);
        if (!lib) return window.dialog.showMessageBox({ message: "暂时不支持此 App 或文件夹", type: "error" });

        T = setInterval(() => {
          void utils.client.pending.getCount.query({ libraryId: lib.id }).then((count) => {
            setPendingCount(count);

            if (count === lib.count) {
              setAdding(false);
              clearInterval(T);
              void utils.library.get.invalidate();
            }
          });
        }, 300);

        void utils.library.get.invalidate();
        setActive(lib.id);
        setAdding(true);
      });
  };

  return (
    <div className="flex h-screen w-screen flex-col">
      <NavBar name={activeItem?.name} platform={platform} />
      <div className="flex w-full flex-1 text-sm">
        <div className="bg-base-200/70 flex h-full w-1/4 flex-col items-center justify-between px-2 pb-4">
          <div className="grid w-full grid-cols-1 gap-y-4">
            <div className="text-base-content border-base-content/20 select-none border-l-2 p-2 capitalize">
              <p className="font-mono text-5xl">{statistics.image}</p>
              <p className="opacity-25">{language?.["electron.renderer.image_count"]}</p>
            </div>

            <div className="text-base-content border-base-content/20 select-none border-l-2  p-2 capitalize">
              <p className="font-mono text-5xl">{statistics.media}</p>
              <p className="opacity-25">{language?.["electron.renderer.image_count"]}</p>
            </div>
          </div>
        </div>

        {active ? (
          <div className="flex-1 p-4 pt-0">
            <div className="list flex h-full flex-col overflow-hidden rounded shadow-md">
              <div>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"
                    />
                  </svg>

                  <span className="ml-2">{language?.["electron.renderer.file_id"]}</span>
                </span>
                <span className="font-mono">{activeItem?.id}</span>
              </div>

              <div>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
                    />
                  </svg>
                  <span className="ml-2">{language?.["electron.renderer.file_path"]}</span>
                </span>
                <span>{activeItem?.dir}</span>
              </div>

              <div>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="ml-2">{language?.["electron.renderer.last_time"]}</span>
                </span>
                <span className="font-mono">{activeItem?.lastSyncTime?.toLocaleString("zh", { hour12: false }) ?? "未同步"}</span>
              </div>

              <div>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5"
                    />
                  </svg>

                  <span className="ml-2 flex items-center">{language?.["electron.renderer.preview"]}</span>
                </span>
                <a onClick={openExternal} className="btn btn-link btn-active btn-sm text-secondary group relative p-0 font-normal normal-case">
                  {webUrl}
                  <div className="absolute right-0 top-8 z-50 hidden rounded bg-white p-2 shadow-md group-hover:block">
                    <QRCodeSVG
                      value={webUrl}
                      level="H"
                      size={156}
                      imageSettings={{
                        src: "./logo.png",
                        width: 48,
                        height: 48,
                        excavate: true,
                      }}
                    />
                  </div>
                </a>
              </div>

              <div>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>

                  <div className="ml-2 flex items-center">
                    {language?.["electron.renderer.status"]}
                    <div className="tooltip before:w-max" data-tip={language?.["electron.renderer.status.tips"]}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="text-base-content/50 h-5 w-5">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                        />
                      </svg>
                    </div>
                  </div>
                </span>
                <span className="font-mono font-medium">
                  <span className="text-success">{activeItem?._count.images}</span>
                  <span className="text-base-content/50 relative -top-0.5 mx-2 font-extralight">|</span>
                  <span className="text-error cursor-pointer" onClick={() => setFaillogsVisable(true)}>
                    {activeItem?._count.fails}
                  </span>
                </span>
              </div>

              <div className="flex flex-1 items-center justify-around !px-0">
                <div className="bg-base-200 flex h-full flex-1 items-center justify-center">
                  <div
                    className="radial-progress text-neutral-content/70 bg-neutral border-neutral/50 border-4"
                    style={{ "--value": percent, "--size": "9rem", "--thickness": "1rem" } as React.CSSProperties}
                  >
                    {adding ? (
                      <div className="text-neutral-content flex flex-col items-center justify-center">
                        <span className="text-neutral-content text-xl font-bold">{pendingCount}</span>
                        <span className="text-neutral-content/80">{language?.["electron.renderer.statistic.tips2"]}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-neutral-content text-xl font-bold">{activeItem?._count.pendings}</span>
                        <span className="text-neutral-content/80">{language?.["electron.renderer.statistic.tips1"]}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex h-full w-1/2 flex-col justify-center space-y-4 px-8">
                  <button className="btn" disabled={disabled} onClick={onSyncClick}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                    <span className="ml-2">同步</span>
                  </button>

                  <button className="btn btn-error btn-outline px-0" disabled={disabled}>
                    <label
                      htmlFor="my-modal"
                      className="flex h-full w-full cursor-pointer items-center justify-center"
                      onClick={() => {
                        if (disabled) return;
                        setDelConfirmVisable(true);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>

                      <span className="ml-2">移除</span>
                    </label>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Empty onAddClick={showOpenDialog} />
        )}

        {/* fails log modal */}
        {activeItem?.id && faillogsVisable && <FailLogs lang={lang} language={language} onClose={() => setFaillogsVisable(false)} libraryId={activeItem.id} />}

        {/* Modal confirm */}
        <input type="checkbox" defaultChecked={delConfirmVisable} id="my-modal" className="modal-toggle" />
        <div className="modal">
          <div className="modal-box max-w-xs">
            <h3 className="text-lg font-bold">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="text-primary h-6 w-6">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  />
                </svg>
                <span className="ml-1">确认移除 ？</span>
              </span>
            </h3>
            <p className="py-4">确认移除当前文件夹/库</p>
            <div className="modal-action">
              <label htmlFor="my-modal" className="btn btn-outline" onClick={() => setDelConfirmVisable(false)}>
                取消
              </label>
              <label htmlFor="my-modal" className="btn" onClick={onRemove}>
                确认
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
