USE VinHousing;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_create_rental_request $$
CREATE PROCEDURE sp_create_rental_request (
    IN p_listing_id        BIGINT UNSIGNED,
    IN p_requester_user_id BIGINT UNSIGNED,
    IN p_message           TEXT,
    IN p_desired_move_in   DATE
)
BEGIN
    DECLARE v_listing_status VARCHAR(20);
    DECLARE v_role           VARCHAR(20);
    DECLARE v_existing_cnt   INT;

    -- 1) Check listing exists & get its status
    SELECT status
    INTO v_listing_status
    FROM listings
    WHERE id = p_listing_id;

    IF v_listing_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Listing does not exist';
    END IF;

    -- 2) Only allow requests on available listings
    IF v_listing_status <> 'verified' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Listing is not open for rental requests';
    END IF;

    -- 3) Check requester is a tenant
    SELECT role
    INTO v_role
    FROM users
    WHERE id = p_requester_user_id;

    IF v_role IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Requester user does not exist';
    END IF;

    IF v_role <> 'tenant' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Only tenants can create rental requests';
    END IF;

    -- 4) Prevent duplicate pending request for same listing & tenant
    SELECT COUNT(*)
    INTO v_existing_cnt
    FROM rental_requests
    WHERE listing_id = p_listing_id
      AND requester_user_id = p_requester_user_id
      AND status = 'pending';

    IF v_existing_cnt > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'You already have a pending request for this listing';
    END IF;

    -- 5) If everything is OK, create rental request
    INSERT INTO rental_requests (
        listing_id,
        requester_user_id,
        message,
        desired_move_in,
        status
    ) VALUES (
        p_listing_id,
        p_requester_user_id,
        p_message,
        p_desired_move_in,
        'pending'
    );
END $$

DELIMITER ;


DELIMITER $$

DROP PROCEDURE IF EXISTS sp_change_issue_status $$
CREATE PROCEDURE sp_change_issue_status (
    IN p_issue_id      BIGINT UNSIGNED,
    IN p_new_status    VARCHAR(20),
    IN p_changed_by    BIGINT UNSIGNED,
    IN p_new_assignee  BIGINT UNSIGNED
)
BEGIN
    DECLARE v_old_status VARCHAR(20);

    -- 1) Validate new status against allowed values
    IF p_new_status NOT IN ('open','triaged','in_progress','resolved','rejected') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid new issue status';
    END IF;

    -- 2) Ensure issue exists and get old status (lock the row)
    SELECT status
    INTO v_old_status
    FROM issue_reports
    WHERE id = p_issue_id
    FOR UPDATE;

    IF v_old_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Issue not found';
    END IF;

    -- 3) Update issue status and optionally assignee
    UPDATE issue_reports
    SET status = p_new_status,
        assignee_user_id = COALESCE(p_new_assignee, assignee_user_id)
    WHERE id = p_issue_id;

    -- 4) Log to audit_logs (optional but nice)
    INSERT INTO audit_logs (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        metadata_json,
        created_at
    ) VALUES (
        p_changed_by,
        'CHANGE_ISSUE_STATUS',
        'issue',
        p_issue_id,
        JSON_OBJECT(
            'old_status', v_old_status,
            'new_status', p_new_status
        ),
        NOW()
    );
END $$

DELIMITER ;
